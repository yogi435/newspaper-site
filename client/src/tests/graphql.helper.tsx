import { MockedProvider } from 'react-apollo/test-utils';
/* import { mount } from 'enzyme'; */
import * as React from 'react';
import { MemoryRouter } from 'react-router';
import { mount } from 'enzyme';
const wait = require('waait');

// import { addTypenameToDocument } from 'apollo-client';

// interface GraphqlMock {
//     request: {
//         query: any,
//         variables?: any
//     };
//     result: {
//         data: any
//     };
// }

export function createQuery(query: any, data: object) {

        return {
            request: {
                query,
                onError: () => new Error('Failed to execute query')
            },
            result: {
                data
            }
        };
}

export function createMutation(query: any, variables: object, data: object) {

        return {
            request: {
                query,
                variables,
            },
            result: {
                data
            }
        };
}

export async function mountWithGraphql(
    graphqlMocks: any[],
    component: JSX.Element | any,
    waitTime: number = 0
) {

    const mounted = mount(
        mockGraphql(
            graphqlMocks,
            component
        )
    );

    await wait(waitTime);
    mounted.update();
    return mounted;
}

export default function mockGraphql(graphqlMocks: any[], component: JSX.Element | any) {

    const wrapper = (
        <MockedProvider mocks={graphqlMocks} addTypename={false}>
            <MemoryRouter>
                {component}
            </MemoryRouter>
      </MockedProvider>
    );

    return wrapper;
}
