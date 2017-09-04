import { jwt } from './../helpers/jwt';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
  GraphQLBoolean,
  GraphQLList
} from 'graphql';

import db from '../db/models';
import sanitize from '../helpers/sanitize';

/**
 * @return max issue + 1 a user can view, or infinity if user is logged in
 *
 * Used in stuff like `select * from pageinfo where issue != getMaxIssueAllowed`
 */
export async function getMaxIssueAllowed(jwt: jwt) {

    if (jwt && jwt.id) {
        return null;
    }

    const maxIssueRow = (await db.models.issues.findOne({
        attributes: ['num'],
        where: {
            ispublic: false
        }
    }));

    return maxIssueRow.dataValues.num;
}


const Users = new GraphQLObjectType({
    name: 'Users',
    description: 'Account holders of the site',
    fields: () => ({
        id: {type: new GraphQLNonNull(GraphQLID)},
        username: {type: new GraphQLNonNull(GraphQLString)},
        firstName: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: (user) => user.f_name
        },
        middleName: {
            type: GraphQLString,
            resolve: (user) => user.m_name
        },
        lastName: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: (user) => user.l_name
        },
        fullName: {
            type: new GraphQLNonNull(GraphQLString),
        },
        email: {
            type: GraphQLString,
            resolve: (user, _, { jwt }) =>

                jwt.id == user.id ? user.email : null
        },
        level: {type: new GraphQLNonNull(GraphQLInt)},
        notifications: {
            type: GraphQLBoolean,
            resolve: (user, test,  { jwt }) =>
                jwt.id == user.id ? user.notifications : null
        },
        twoFactor: {
            type: GraphQLBoolean,
            resolve: (user, _, { jwt }) =>

                jwt.id == user.id ? user.two_fa_enabled : null
        },
        views: {
            type: GraphQLInt,
            resolve: async (user, _, { jwt }) => +db.models.pageinfo.sum('views', {
                where: {
                    authorid: sanitize(user.id),
                    issue: {
                        $ne: await getMaxIssueAllowed(jwt)
                    }
                }
            }) || 0 // don't know why I need + and || but I do
        },
        articleCount: {
            type: GraphQLInt,
            resolve: async (user, _, { jwt }) => {

                return db.models.pageinfo.count({
                    where: {
                        authorid: sanitize(user.id),
                        issue: {
                            $ne: await getMaxIssueAllowed(jwt)
                        }
                    }
                })
            }
        },
        profileLink: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: user => user.email.split('@')[0]
        },
        articles: {
            type: new GraphQLNonNull(new GraphQLList(Articles)),
            resolve: async (user, _, { jwt }) => {

                return db.models.pageinfo.findAll({
                    where: {
                        authorid: user.id,
                        issue: {
                            $ne: await getMaxIssueAllowed(jwt)
                        }
                    }
                })
            }
        },
        canEdit: {
            type: GraphQLBoolean,
            resolve: (user, _, { jwt }) => jwt.id === user.id || jwt.level > user.level
        }


        /* // PRIVATE types. Putting them here just to complete the db table
        // don't use these
        password: {type: new GraphQLNonNull(GraphQLString)},
        authCode: {type: new GraphQLNonNull(GraphQLString)},
        authTime: {type: new GraphQLNonNull(GraphQLString)},
        */
    })
});

const Articles = new GraphQLObjectType({
    name: 'Articles',
    description: 'Articles created by users',
    fields: () => ({
        id: {type: new GraphQLNonNull(GraphQLID)},
        dateCreated: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: article => article.created
        },
        lede: {type: new GraphQLNonNull(GraphQLString)},
        body: {type: new GraphQLNonNull(GraphQLString)},
        url: {type: new GraphQLNonNull(GraphQLString)},
        article: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: article => {

                let content = article.lede + article.body;

                (article.img_url || []).forEach((img: string) => {

                    if (content.indexOf("data-src") !== -1) {
                        content = content.replace('data-src', `src='${img}'`);
                    }
                });

                return content;
            }
        },
        imgUrl: {type: new GraphQLNonNull(new GraphQLList(GraphQLString))},
        slideImages: {type: new GraphQLNonNull(new GraphQLList(GraphQLString))},
        issue: {type: new GraphQLNonNull(GraphQLInt)},
        views: {type: new GraphQLNonNull(GraphQLInt)},
        displayOrder: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: article => article.display_order
        },
        tags: {
            type: new GraphQLNonNull(Tags),
            resolve: (article) => db.models.tags.findOne({
                where: {art_id: article.id}
            })
        },
        authorId: {type: new GraphQLNonNull(GraphQLID)},
        author: {
            type: new GraphQLNonNull(Users),
            resolve: async (article, args, { loaders }) => loaders.default.user.load(sanitize(article.authorid))
        },
        comments: {
            type: new GraphQLList(Comments),
            resolve: (article) => db.models.comments.findAll({
                where: {art_id: article.id}
            })
        },
        canEdit: {
            type: new GraphQLNonNull(GraphQLBoolean),
            resolve: (article, _, { jwt }) => {
                return jwt.level > 2 || jwt.id == article.authorid;
            }
        }
    })
});

const Issues = new GraphQLObjectType({
    name: 'Issues',
    description: 'Issues - Every article has one',
    fields: () => ({
        num: {type: new GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLString},
        public: {
            type: new GraphQLNonNull(GraphQLBoolean),
            resolve: (issue) => !!issue.ispublic
        },
        datePublished: {
            type: GraphQLString,
            resolve: (issue) => issue.madepub
        },
        articles: {
            type: new GraphQLNonNull(new GraphQLList(Articles)),
            resolve: (issue) => db.models.pageinfo.findAll({
                where: sanitize({issue: issue.num})
            })
        },
        views: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: async (issue) => db.models.pageinfo.sum('views', {
                where: {
                    issue: sanitize(issue.num)
                }
            })
        },
        max: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: async (issue) => db.models.issues.max('num')
        },
        canEdit: {
            type: GraphQLBoolean,
            resolve: (issue, _, { jwt }) => jwt.level > 2 && !issue.public
        }
    })
});

const Comments = new GraphQLObjectType({
    name: 'Comments',
    description: 'Comments in articles',
    fields: () => ({
        id: {type: new GraphQLNonNull(GraphQLID)},
        artId: {
            type: new GraphQLNonNull(GraphQLID),
            resolve: (comment) => comment.art_id
        },
        authorId: {
            type: new GraphQLNonNull(GraphQLID),
            resolve: (comment) => comment.authorid
        },
        content: {type: new GraphQLNonNull(GraphQLString)},
        dateCreated: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: comment => comment.created
        },
        author: {
            type: new GraphQLNonNull(Users),
            resolve: (comment, args, { loaders }) => loaders.default.user.load(sanitize(comment.authorid))
        },
        canDelete: {
            type: new GraphQLNonNull(GraphQLBoolean),
            resolve: (comment, _, { jwt }) =>
                jwt.level > 2 || jwt.id === comment.authorid
        }
    })
});

const Tags = new GraphQLObjectType({
   name: 'Tags',
   description: 'Tags of articles',
   fields: () => ({
       id: {type: new GraphQLNonNull(GraphQLID)},
        artId: {
            type: new GraphQLNonNull(GraphQLID),
            resolve: tag => tag.art_id
        },
        tag1: {type: new GraphQLNonNull(GraphQLString)},
        tag2: {type: GraphQLString},
        tag3: {type: GraphQLString},
        all: {
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
            resolve: tags => [tags.tag1, tags.tag2, tags.tag3].filter(tag => !!tag)
        }
   })
});

const Jwt = new GraphQLObjectType({
    name: 'JWT',
    description: 'JSON web token',
    fields: () => ({
        jwt: {
            type: GraphQLString
        }
    })
});

const PasswordRecovery = new GraphQLObjectType({
    name: 'RecoverPassword',
    description: 'Recover forgotten password',
    fields: () => ({
        message: {
            type: GraphQLString
        }
    })
});

const Mission = new GraphQLObjectType({
    name: 'Mission',
    description: 'Mission statement',
    fields: () => ({
        mission: {
            type: GraphQLString
        },
        canEdit: {
            type: GraphQLBoolean,
            resolve: (mission, _, { jwt }) => jwt.level > 2
        }
    })
});

export {
    Users,
    Articles,
    Issues,
    Comments,
    Tags,
    Jwt,
    PasswordRecovery,
    Mission
};