import React from 'react';
import Container from '../../components/Container';
import Table from '../../components/Table';
import FormContainer from '../../components/Form/container';
import Input from '../../components/Form/Input';
import SecretTwinsContainer from '../../components/Form/SecretTwins/container';
import fetchFromApi from '../../helpers/fetchFromApi';
import { Link } from 'react-router-dom'

class ArticleTable extends React.Component {

    constructor() {
        super();

        this.state = {

            articles: [[]],
            tags: [], // this is all tags that exist in any article ever published
            issueInfo: {},
            history: []
        };
    }

    async putData(num = null) {

        const lastPath = window.location.pathname.split("/").slice(-1);

        num = (isNaN(+lastPath) || ((!isNaN(num)) && num)) ? num : lastPath;


        // use cached results (don't load new info)
        if (this.state.history[num]) {
            this.setState({
                articles: this.state.history[num].articles,
                issueInfo: this.state.history[num].issueInfo
            });

            window.history.pushState({}, `Issue ${num}`, num);
        }
        else {

            const data = await this.getData(num);
            const json = await data.json();

            window.history.pushState({}, `Issue ${num}`, isNaN(+lastPath) ? "modifyArticles/"+json[2].num : json[2].num);

            this.setArticleInfo(json);
        }
    }

    componentWillMount() {
        this.putData();
    }

    async getData(num) {
        // NOTE: REMOVE query after done building this
         return await fetchFromApi(`articleGroup?articlesFor=${num}`);

    }


    setArticleInfo(data) {

        const articles = data[0].map(article => {

                const tagArr = article.tags.split(', ');

                return [
                    <Link to={`/issue/${data[2].num}/story/${article.url}`}>{decodeURIComponent(article.url)}</Link>,
                    article.created,
                    <Link to={`/u/${article.author_username}`}>{article.author_name}</Link>,
                    <SecretTwinsContainer
                        original={<select name="tag[]" formMethod="put" defaultValue={tagArr} required multiple>{data[1].map((val) =>
                            <option key={val} defaultValue={val}>{val}</option>
                        )}</select>}
                        props={{
                            name: "artId[]",
                            value: article.art_id
                        }}
                    />,
                    article.views,
                    // Same info in SecretTwins as right above so that artId is submitted no matter what
                    <SecretTwinsContainer
                      original={<input type="number" formMethod="put" name="order[]" defaultValue={article.display_order} />}
                        props = {{
                            name: "artId[]",
                            formMethod: "put",
                            value: article.art_id
                        }}
                    />
,
                    <input type="checkbox" formMethod="delete" name="delArt[]" value={article.art_id} />
                ]
        });

        const history = [...this.state.history];
        history[data[2].num] = {articles, issueInfo: data[2]};

        this.setState({
            articles,
            issueInfo: data[2],
            history
        });
    }

    render() {

        const headings = [
            'Article',
            'Date Created',
            'Uploaded By',
            'Type',
            'Views',
            'Display Order',
            <span className="danger">Delete</span>
        ];

        return (
            <Container
                heading="Articles"
                className="tableContainer"
                children={
                    <div>
                        <Input
                          label="Issue Number"
                          props={{
                            type: "number",
                            min: 1,
                            key: this.state.issueInfo.num,
                            defaultValue: this.state.issueInfo.num,
                            max: this.state.issueInfo.max,
                            onChange: (event) => this.putData(event.target.value)
                          }}
                        />
                        <FormContainer
                            method={['put', 'delete']}
                            action="/api/articleGroup" // up 1 directory since pushing history changes in this.putData()
                            children={
                                <div>
                                    <Table headings={headings} rows={this.state.articles}/>


                                    <Input
                                      label="Password"
                                      props={{
                                          type: "password",
                                          name: "password",
                                          required: true
                                      }}
                                    />
                                    <input type="submit" value="Modify" />
                                </div>
                            }
                        />
                    </div>
                }
            />
        )
    }
}

export default ArticleTable;