'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Koa = _interopDefault(require('koa'));
var KoaRouter = _interopDefault(require('koa-router'));
var koaLogger = _interopDefault(require('koa-logger'));
var koaBody = _interopDefault(require('koa-bodyparser'));
var koaCors = _interopDefault(require('@koa/cors'));
var apolloServerKoa = require('apollo-server-koa');
var merge = _interopDefault(require('lodash.merge'));
var GraphQLJSON = _interopDefault(require('graphql-type-json'));
var graphqlTools = require('graphql-tools');
var request = _interopDefault(require('request-promise-native'));
var graphql = require('graphql');

/**
 * Creates a request following the given parameters
 * @param {string} url
 * @param {string} method
 * @param {object} [body]
 * @param {boolean} [fullResponse]
 * @return {Promise.<*>} - promise with the error or the response object
 */
async function generalRequest(url, method, body, fullResponse) {
	const parameters = {
		method,
		uri: encodeURI(url),
		body,
		json: true,
		resolveWithFullResponse: fullResponse
	};
	if (process.env.SHOW_URLS) {
		// eslint-disable-next-line
		console.log(url);
	}

	try {
		return await request(parameters);
	} catch (err) {
		return err;
	}
}

/**
 * Adds parameters to a given route
 * @param {string} url
 * @param {object} parameters
 * @return {string} - url with the added parameters
 */
function addParams(url, parameters) {
	let queryUrl = `${url}?`;
	for (let param in parameters) {
		// check object properties
		if (
			Object.prototype.hasOwnProperty.call(parameters, param) &&
			parameters[param]
		) {
			if (Array.isArray(parameters[param])) {
				queryUrl += `${param}=${parameters[param].join(`&${param}=`)}&`;
			} else {
				queryUrl += `${param}=${parameters[param]}&`;
			}
		}
	}
	return queryUrl;
}

/**
 * Generates a GET request with a list of query params
 * @param {string} url
 * @param {string} path
 * @param {object} parameters - key values to add to the url path
 * @return {Promise.<*>}
 */
function getRequest(url, path, parameters) {
	const queryUrl = addParams(`${url}/${path}`, parameters);
	return generalRequest(queryUrl, 'GET');
}

/**
 * Merge the schemas in order to avoid conflicts
 * @param {Array<string>} typeDefs
 * @param {Array<string>} queries
 * @param {Array<string>} mutations
 * @return {string}
 */
function mergeSchemas(typeDefs, queries, mutations) {
	return `${typeDefs.join('\n')}
    type Query { ${queries.join('\n')} }
    type Mutation { ${mutations.join('\n')} }`;
}

function formatErr(error) {
	const data = graphql.formatError(error);
	const { originalError } = error;
	if (originalError && originalError.error) {
		const { path } = data;
		const { error: { id: message, code, description } } = originalError;
		return { message, code, description, path };
	}
	return data;
}

const userTypeDef = `
type User {
    id: Int!
    name: String!
    lastname: String!
    birthdate: String!
    email: String!
    password: String!
    idrole: Int!
}
input UserInput {
    name: String!
    lastname: String!
    birthdate: String!
    email: String!
    password: String!
    idrole: Int!
}`;

const userQueries = `
    allUsers: [User]!
    userById(id: Int!): User!
`;

const userMutations = `
    createUser(user: UserInput!): User!
    deleteUser(id: Int!): Int
    updateUser(id: Int!, user: UserInput!): User!
`;

const roleTypeDef = `
type Role {
    id: Int!
    namerole: String!
   
}
input RoleInput {
    namerole: String!
}`;

const roleQueries = `
    allRoles: [Role]!
    roleById(id: Int!): Role!
`;

const roleMutations = `
    createRole(role: RoleInput!): Role!
    deleteRole(id: Int!): Int
    updateRole(id: Int!, role: RoleInput!): Role!
`;

const locationTypeDef = `
type Location {
    location_id: Int!
    country: String!
    city: String!
    state: String!
}
input LocationInput {
    country: String!
    city: String!
    state: String!
}`;

const locationQueries = `
    allLocations: [Location]!
    locationById(location_id: Int!): Location!
`;

const locationMutations = `
    createLocation(location: LocationInput!): Location!
    deleteLocation(location_id: Int!): Int
    updateLocation(location_id: Int!, location: LocationInput!): Location!
`;

const lodgingiTypeDef = `
type Lodging_image {
    lodging_image_id: Int!
    lodging_id: Int!
    url: String!
}
input Lodging_imageInput {
    lodging_id: Int!
    url: String!
}`;

const lodgingiQueries = `
    allLodging_image: [Lodging_image]!
    lodging_imageById(lodging_image_id: Int!): Lodging_image!
`;

const lodgingiMutations = `
    createLodging_image(lodging_image: Lodging_imageInput!): Lodging_image!
    deleteLodging_image(lodging_image_id: Int!): Int
    updateLodging_image(lodging_image_id: Int!, lodging_image: Lodging_imageInput!): Lodging_image!
`;

const lodgingTypeDef = `
type Lodging {
    lodging_id: Int!
    host_id: Int!
    lodging_name: String!
    phone_number: Int!
    lodging_type: Int!
    lodging_class: Int!
    is_exclusive: Int!
    is_company: Int!
    guest_number: Int!
    rooms_number: Int!
    beds_number: Int!
    bathrooms_number: Int!
    location_id: Int!
    address: String!
    extra_address: String!
    time_before_guest: Int!
    time_arrive_start: Int!
    time_arrive_end: Int!
    with_wifi: Int!
    with_cable_tv: Int!
    with_air_conditioning: Int!
    with_phone: Int!
    with_kitchen: Int!
    with_cleaning_items: Int!
    price_per_person_and_nigth: Float!
    lodging_description: String!
    lodging_provide: Int!

}
input LodgingInput {
    host_id: Int!
    lodging_name: String!
    phone_number: Int!
    lodging_type: Int!
    lodging_class: Int!
    is_exclusive: Int!
    is_company: Int!
    guest_number: Int!
    rooms_number: Int!
    beds_number: Int!
    bathrooms_number: Int!
    location_id: Int!
    address: String!
    extra_address: String!
    time_before_guest: Int!
    time_arrive_start: Int!
    time_arrive_end: Int!
    with_wifi: Int!
    with_cable_tv: Int!
    with_air_conditioning: Int!
    with_phone: Int!
    with_kitchen: Int!
    with_cleaning_items: Int!
    price_per_person_and_nigth: Float!
    lodging_description: String!
    lodging_provide: Int!
}`;

const lodgingQueries = `
    allLodgings: [Lodging]!
    lodgingById(lodging_id: Int!): Lodging!
`;

const lodgingMutations = `
    createLodging(lodging: LodgingInput!): Lodging!
    deleteLodging(lodging_id: Int!): Int
    updateLodging(lodging_id: Int!, lodging: LodgingInput!): Lodging!
`;

const reservationTypeDef = `
type Reservation {
    reservation_id: Int!
    user_id: Int!
    start_date: String!
    end_date: String!
    guest_adult_number: Int!
    guest_children_number: Int!
    is_cancel: Boolean!
}
input ReservationInput {
    user_id: Int!
    start_date: String!
    end_date: String!
    guest_adult_number: Int!
    guest_children_number: Int!
    is_cancel: Boolean!
}`;

const reservationQueries = `
    allReservations: [Reservation]!
    reservationById(id: Int!): Reservation!
`;

const reservationMutations = `
    createReservation(reservation: ReservationInput!): Reservation!
    deleteReservation(id: Int!): Int
    updateReservation(id: Int!, reservation: ReservationInput!): Reservation!
`;

//const URL = `http://${url}:${port}/${entryPoint}`;
const URL = `http://3.132.9.148:3000/api/v1/role`;

const Rresolvers = {
	Query: {
		allRoles: (_) =>
			getRequest(URL, ''),
		roleById: (_, { id }) =>
			generalRequest(`${URL}/${id}`, 'GET'),
	},
	Mutation: {
		createRole: (_, { role }) =>
			generalRequest(`${URL}`, 'POST', role),
		updateRole: (_, { id, role }) =>
			generalRequest(`${URL}/${id}`, 'PUT', role),
		deleteRole: (_, { id }) =>
			generalRequest(`${URL}/${id}`, 'DELETE')
	}
};

//const URL = `http://${url}:${port}/${entryPoint}`;
const URL$1 = `http://3.132.9.148:3000/api/v1/users`;

const Uresolvers = {
	Query: {
		allUsers: (_) =>
			getRequest(URL$1, ''),
		userById: (_, { id }) =>
			generalRequest(`${URL$1}/${id}`, 'GET'),
	},
	Mutation: {
		createUser: (_, { user }) =>
			generalRequest(`${URL$1}`, 'POST', user),
		updateUser: (_, { id, user }) =>
			generalRequest(`${URL$1}/${id}`, 'PUT', user),
		deleteUser: (_, { id }) =>
			generalRequest(`${URL$1}/${id}`, 'DELETE')
	}
};

//const URL = `http://${url}:${port}/${entryPoint}`;
const URL$2 = `http://3.132.9.148:3030/api/v1/location`;

const Locresolvers = {
	Query: {
		allLocations: (_) =>
			getRequest(URL$2, ''),
		locationById: (_, { id }) =>
			generalRequest(`${URL$2}/${id}`, 'GET'),
	},
	Mutation: {
		createLocation: (_, { location }) =>
			generalRequest(`${URL$2}`, 'POST', location),
		updateLocation: (_, { id, location }) =>
			generalRequest(`${URL$2}/${id}`, 'PUT', location),
		deleteLocation: (_, { id }) =>
			generalRequest(`${URL$2}/${id}`, 'DELETE')
	}
};

//const URL = `http://${url}:${port}/${entryPoint}`;
const URL$3 = `http://3.132.9.148:3030/api/v1/lodging_image`;

const Lodiresolvers = {
	Query: {
		allLodging_image: (_) =>
			getRequest(URL$3, ''),
		lodging_imageById: (_, { id }) =>
			generalRequest(`${URL$3}/${id}`, 'GET'),
	},
	Mutation: {
		createLodging_image: (_, { lodging_image }) =>
			generalRequest(`${URL$3}`, 'POST', lodging_image),
		updateLodging_image: (_, { id, lodging_image }) =>
			generalRequest(`${URL$3}/${id}`, 'PUT', lodging_image),
		deleteLodging_image: (_, { id }) =>
			generalRequest(`${URL$3}/${id}`, 'DELETE')
	}
};

//const URL = `http://${url}:${port}/${entryPoint}`;
const URL$4 = `http://3.132.9.148:3030/api/v1/lodging`;

const Lodresolvers = {
	Query: {
		allLodgings: (_) =>
			getRequest(URL$4, ''),
		lodgingById: (_, { id }) =>
			generalRequest(`${URL$4}/${id}`, 'GET'),
	},
	Mutation: {
		createLodging: (_, { lodging }) =>
			generalRequest(`${URL$4}`, 'POST', lodging),
		updateLodging: (_, { id, lodging }) =>
			generalRequest(`${URL$4}/${id}`, 'PUT', lodging),
		deleteLodging: (_, { id }) =>
			generalRequest(`${URL$4}/${id}`, 'DELETE')
	}
};

//const URL = `http://${url}:${port}/${entryPoint}`;
const URL$5 = `http://3.132.9.148:3000/api/v1/reservation`;

const Reresolvers = {
	Query: {
		allReservations: (_) =>
			getRequest(URL$5, ''),
		reservationById: (_, { id }) =>
			generalRequest(`${URL$5}/${id}`, 'GET'),
	},
	Mutation: {
		createReservation: (_, { reservation }) =>
			generalRequest(`${URL$5}`, 'POST', reservation),
		updateReservation: (_, { id, reservation }) =>
			generalRequest(`${URL$5}/${id}`, 'PUT', reservation),
		deleteReservation: (_, { id }) =>
			generalRequest(`${URL$5}/${id}`, 'DELETE')
	}
};

//users
//lodging
// reservation
// merge the typeDefs
const mergedTypeDefs = mergeSchemas(
	[
		'scalar JSON',
		
		roleTypeDef,
		userTypeDef,
		locationTypeDef,
		lodgingiTypeDef,
		lodgingTypeDef,
		reservationTypeDef
	],
	[
		userQueries,
		roleQueries,
		locationQueries,
		lodgingiQueries,
		lodgingQueries,
		reservationQueries
	],
	[
		userMutations,
		roleMutations,
		locationMutations,
		lodgingiMutations,
		lodgingMutations,
		reservationMutations
	]
);

// Generate the schema object from your types definition.
var graphQLSchema = graphqlTools.makeExecutableSchema({
	typeDefs: mergedTypeDefs,
	resolvers: merge(
		{ JSON: GraphQLJSON }, // allows scalar JSON
		Uresolvers,
		Rresolvers,
		Locresolvers,
		Lodiresolvers,
		Lodresolvers,
		Reresolvers

	)
});

const app = new Koa();
const router = new KoaRouter();
const PORT = process.env.PORT || 5000;

app.use(koaLogger());
app.use(koaCors());

// read token from header
app.use(async (ctx, next) => {
	if (ctx.header.authorization) {
		const token = ctx.header.authorization.match(/Bearer ([A-Za-z0-9]+)/);
		if (token && token[1]) {
			ctx.state.token = token[1];
		}
	}
	await next();
});

// GraphQL
const graphql$1 = apolloServerKoa.graphqlKoa((ctx) => ({
	schema: graphQLSchema,
	context: { token: ctx.state.token },
	formatError: formatErr
}));
router.post('/graphql', koaBody(), graphql$1);
router.get('/graphql', graphql$1);

// test route
router.get('/graphiql', apolloServerKoa.graphiqlKoa({ endpointURL: '/graphql' }));

app.use(router.routes());
app.use(router.allowedMethods());
// eslint-disable-next-line
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));