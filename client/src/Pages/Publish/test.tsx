import * as React from 'react';
import { PublishContainer } from './container';
import { mount } from 'enzyme';
import * as renderer from 'react-test-renderer';
import * as sinon from 'sinon';
import casual from '../../tests/casual.data';
import { submitForm } from '../../tests/enzyme.helpers';
// import { TagQuery } from '../../graphql/tags';

// import mockGraphql from '../../tests/graphql.helper';

describe('<PublishContainer>', () => {

    type createArticleParams = {
            variables: {
                article: string,
                tags: string[],
                url: string
            }
        };

    function mockCreateArticle(params?: createArticleParams) {

        return Promise.resolve({
            data: {
                createArticle: {
                    url: casual.url,
                    issue: casual.randomPositive
                }
            }
        });
    }

    function setup(
        createArticle: typeof mockCreateArticle = mockCreateArticle,
        createTag: Function = casual.function
     ) {

        // return mockGraphql(
        //     TagQuery,
        //     {tags: ['hi', 'bye', 'go'] },
        //     <PublishContainer history={[]} createArticle={createArticle || mockCreateArticle}/>
        // ).wrapper;

        return mount(
            <PublishContainer
              history={[]}
              createArticle={createArticle}
              createTag={createTag}
            />
        );
    }

    /**
     * Gives PublishContainer a fake version of state.editor (that has all functionality needed)
     */
    function setFakeEditor(wrapper: any, initialContent: string = '') {

        wrapper.find(PublishContainer).node.state.editor = {

            content: initialContent,
            setContent(content: string) {
                this.content = content;
            },
            getContent() {
                return this.content;
            }
        };
    }


    describe('snapshots', () => {

        it('renders correctly', () => {

            const tree = renderer.create(

                <PublishContainer
                    history={[]}
                    createArticle={mockCreateArticle}
                />
            ).toJSON();

            expect(tree).toMatchSnapshot();
        });
    });

    describe('#autoFormat', () => {

        /**
         * Sets up and tests #autoFormat
         *
         * @param content - original, badly formatted content
         * @param expected - properly formatted version of content
         */
        function testAutoFormat(content: string, expected: string) {

            const wrapper = setup();
            setFakeEditor(wrapper, content);

            const component = (wrapper.find(PublishContainer) as any).node;

            component.autoFormat();
            const newEditorContents = component.state.editor.getContent();

            expect(newEditorContents).toBe(expected);
        }

        it(`adds an <h1> if none exists and there's text`, () => {

            const author = casual.full_name;
            const title = casual.title;

            testAutoFormat(`<h4>${title}</h4><p>${author}</p>`, `<h1>${title}</h1><h4>${author}</h4>`);
        });

        it('adds an <h4> if none exists', () => {

            const author = casual.full_name;
            const title = casual.title;

            testAutoFormat(`<h1>${title}</h1><p>${author}</p>`, `<h1>${title}</h1><h4>${author}</h4>`);
        });

        it('adds an <h1> and <h4> if none exists', () => {

            const author = casual.full_name;
            const title = casual.title;

            testAutoFormat(`<p>${title}</p><strong>${author}</strong>`, `<h1>${title}</h1><h4>${author}</h4>`);
        });

        it(`doesn't mess with any html other than first 2 tags`, () => {

            const author = casual.full_name;
            const title = casual.title;

            testAutoFormat(
                `<p>${title}</p><strong>${author}</strong><em>This should not change</em>`,
                `<h1>${title}</h1><h4>${author}</h4><em>This should not change</em>`
            );
        });
    });

    describe('#onTagChange', () => {

        it(`toggles addTag input when 'other' is selected`, () => {

            const wrapper = setup();

            expect(wrapper.find('input[name="addTag"]').node).toBeFalsy();

            wrapper.find('option[value="other"]').simulate('change');

            expect(wrapper.find('input[name="addTag"]').node).toBeTruthy();
        });

        it('submits new tag to createTag', () => {

            let newTag = casual.word;
            const spy = sinon.spy();

            const wrapper = setup(mockCreateArticle, (params: { variables: { tag: string} }) => {
                spy();
                expect(params.variables.tag).toBe(newTag);
            });

            setFakeEditor(wrapper, '');

            wrapper.find('option[value="other"]').simulate('change');
            wrapper.find('input[name="addTag"]').node.value = newTag;

            submitForm(wrapper);

            expect(spy.called).toBeTruthy(); // make sure that createTag was called
        });
    });

    describe('#onSubmit', () => {

        /**
         * Fills out form with random data
         */
        function fillOutForm(wrapper: any) {

            const url: string = casual.url;
            const tags = new Set<HTMLOptionElement>();
            const content: string = casual.sentences(casual.randomPositive);

            setFakeEditor(wrapper, content);

            wrapper.find('input[name="name"]').node.value = url;

            const tagSelect = wrapper.find('select[name="tags"]');
            const tagOptions = [...tagSelect.node.options];

            while (tags.size < casual.integer(1, 3)) {

                const indexOfTag = casual.integer(1, tagOptions.length - 1);
                // console.log('====================================');
                // console.log(tagOptions);
                // console.log('====================================');
                tagOptions[indexOfTag].selected = true;
                tags.add(tagOptions[indexOfTag]);
            }

            wrapper.find('select[name="tags"]').node.selectedOptions = [...tags];

            return {
                tags: [...tags].map(option => option.value),
                url,
                article: content
            };
        }

        it('calls props.createArticle when submit button is clicked', () => {

            const spy = sinon.stub()
            .returns(mockCreateArticle());

            const wrapper = setup(spy);

            fillOutForm(wrapper);

            wrapper.find('form').first().simulate('submit');

            expect(spy.called).toBeTruthy();
        });

        it('gives createArticle proper data', () => {

            let expected = {};

            const wrapper = setup((params: {variables: {url: string, tags: string[], article: string}}) => {

                expect(params.variables).toEqual(expected);

                return mockCreateArticle();
            });

            expected = fillOutForm(wrapper);

            wrapper.find('form').first().simulate('submit');
        });
    });
});
