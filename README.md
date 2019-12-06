# Wagger-api

![Website](https://i.imgur.com/OzaCqhE.jpg)

[Deployed Client](https://asooge.github.io/wagger-client/)

[Deployed API](https://protected-beach-93259.herokuapp.com/)

[Client Github](https://github.com/asooge/wagger-client)

[API Github](https://github.com/asooge/wagger-api)

Wagger is an app for dogs to meet other dogs to play with. In today's busy society, most dogs
don't have owners who can play with them for hours upon hours every day. That's where Wagger
comes in. Create a profile and meet other dogs in your area that will be your perfect
playmate. View your profile and update every aspect to make sure you're putting your
best paw forward.

Designing the backend was the most challenging aspect of this project. I chose to use
an Express server with a MongoDB because of the way data is stored entirely in the
User model. There were challenges with relationships between two users, but I was able
to save relationships by storing references to the other user inside an array of likes
and an array of matches.

The most challenging aspect was creating the match logic which requires the API to find
the user document that is being liked, and check if that user also likes the current
user. If this is true, then the API will create a match on both the current user and
the liked user, each with a reference to the other. In this way, the API can always
check if theres a match relationship to another user by searching the match array for
a reference to that user id.

This way of handling relationships is a bit difficult in that anytime the match object
was updated on the user end, it would also have to mirror the changes on the other
user's match object.

Additional challenges were found in the integration of AWS S3 for file storage, but
once this was setup correctly, I found it to be very reliable.

MongoDB was a difficult choice for an app that is very dependent on relationships,
However I found it useful that all the data was stored in the User model, because
using React on the front-end, I was able to return the update user data and save
that to state. This way, the representation on the client side would automatically
reflect the data on the server.

```
User Stories

As a user, I would like to quickly and easily create a profile
As a user, I would like to upload images directly from my computer
As a user, I would like to view other profiles and determine if they would be a match
As a user, I would like to see my full profile, and make changes as I see fit
As a user, I would like to view all my matches
As a user, I would like to be able to message my match
As a user, I would like to be able to delete matches if neccessary
As a user, I would like to have unlimited dog profiles, or at least know when I can view additonal dogs
As a user, I would like an intuitive interface where I can easily navigate from one view to another.
As a user, I would like to be able to sign out, and continue from where I left off when I sign back in.
```


![ERD](https://i.imgur.com/UZQanKW.jpg)

## API Endpoints

GET '/wagger/:id' get 5 waggers for a particular user. Route will only return waggers
if the last pull is greater than 24 hours past. On successful pull, updates last
pull to the current time.

GET '/users/:id' returns user data for a single user.

POST '/wagger/:id' dislike a dog and moves to next by incrementing wag++

PATCH '/users/:id/likes/:user' like a dog and run logic to determine match. On match,
create a new match on both users and return updated user data. Otherwise just return
a like and increment wag++

DELETE '/users/:id/matches' delete a match and return updated user data.

POST '/users/:id/name' create or update dog name

POST '/users/:id/speak' create or update speak

POST '/users/:id/images/:num' create dog image

PATCH '/users/:id/images/:num' update a particular dog image

POST '/users/:id/profile' create a profile image

PATCH 'users/:id/profile' update a particular dog image

POST '/users/:id/matches/:match/messages' create a message for a particular match

POST '/sign-up' sign up for a new account

POST '/sign-in' sign in to an existing account

PATCH '/change-password' update password

DELETE '/sign-out' sign out when signed in


## Built With


* [Node.JS](https://nodejs.org/en/) - Backend language
* [Express.JS](https://expressjs.com/) - Framework for Node
* [Mongoose](https://mongoosejs.com/) - Object model for Node.JS
* [MongoDB](https://www.mongodb.com/) - NoSQL database
