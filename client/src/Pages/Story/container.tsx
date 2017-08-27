import * as React from 'react';
import httpNotification from '../../helpers/Notification';

import { compose, graphql, withApollo } from 'react-apollo';
import { ArticleQuery } from '../../graphql/article';
import { ArticleUpdate } from '../../graphql/articles';

import { Article, ArticleInfo } from './shared.interfaces';
import Story from './';

interface Props {

    client: {
        query: ( params: {
            query: typeof ArticleQuery, variables: { issue: number; url: string }
        } ) => Promise<{data: { articles: Article[] } }>;
    };
    updateArticle: ( params: {
        variables: {
            data: {
                id: string;
                article: string;
            }
        }
    }) => void; // not really void
}

class StoryContainer extends React.Component<Props, ArticleInfo> {

    constructor() {
        super();

        this.state = {} as ArticleInfo;

        this.onSaveEdits = this.onSaveEdits.bind(this);
        this.onSubmit = this.onSubmit.bind(this);

    }

    /**
     * Saves e.target.innerHTML to this.state[indexToChange]
     */
    onSaveEdits(indexToChange: string, e: Event) {

        const newState = {};
        newState[indexToChange] = (e.target as HTMLElement).innerHTML;

        this.setState(newState);
    }

    async componentWillMount() {

        const path = window.location.pathname.split('/');
        const issue = +path[2];
        const url = path[4];

        const { data } = await this.props.client.query({
            query: ArticleQuery,
            variables: {
                issue,
                url
            }
        });

        const article = data.articles[0];

        const heading = article.article.match(/^[\s\S]+?<\/h4>/)![0];
        const body = article.article.replace(heading, '');

        this.setState({
            issue,
            url,
            heading,
            body,
            canEdit: article.canEdit,
            comments: article.comments || [],
            tags: {
                all: article.tags.all
            },
            id: article.id
        });
    }

    onSubmit() {

        this.props.updateArticle({
            variables: {
                data: {
                    id: this.state.id,
                    article: this.state.heading + this.state.body
                }
            }
        });

        httpNotification('Article Updated', 200);
    }

    render() {

        if (!this.state.id) {
            return null;
        }

        return (
            <Story
              {...this.state}
              onSaveEdits={this.onSaveEdits}
              onSubmit={this.onSubmit}
            />
        );
    }
}

const location = window.location.pathname.split('/');

const StoryContainerWithData = compose(
    graphql(ArticleQuery, {
        options: {
            variables: {
                issue: +location[2],
                url: location[4],
            }
        }
    }),
    graphql(ArticleUpdate, {name: 'updateArticle'}),
)(StoryContainer as any);

export default withApollo(StoryContainerWithData);