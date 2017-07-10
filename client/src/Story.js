import React from 'react';
import commands from './execCommands.min.js'
import './stormStory.min.css'

class Story extends React.Component {

    constructor() {
        super();

        this.state = {

            heading: "",
            body: "",
            canEdit: false,
            comments: [],
            tags: "",
            id: null
        }
    }

    async componentWillMount() {

        const url = window.location.pathname.split("/");

        const article = await fetch(`/api/story?issue=${url[2]}&name=${url[4]}`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(data => data.json());

        const heading = article.body.match(/^[\s\S]+?<\/h4>/);
        const body = article.body.replace(heading, "");

        this.setState({
            heading,
            body: body,
            canEdit: article.can_edit,
            comments: article.comments,
            tags: article.tags,
            id: article.id
        });
    }

    render() {
        return <div>

                   <div id="tags">Tag(s): {this.state.tags}</div>
                   <article id="story" contentEditable={this.state.canEdit} >
                       <div dangerouslySetInnerHTML={{__html: this.state.heading}}/>

                       <section className="storyContainer" dangerouslySetInnerHTML={{__html: this.state.body}}/>
                   </article>
               </div>
    }
}

export default Story;