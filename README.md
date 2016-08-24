# React Firebase

Personal React bindings for Firebase. Designed to look and feel like `react-redux` which leads to clean, testable code by using higher order wrapper components. 

### Install

React Firebase requires React 0.14 or later.

```sh
npm install --save aj0strow/react-firebase
```

This assumes that you’re using npm package manager with a module bundler like Webpack or Browserify to consume CommonJS modules.

### Usage

React Firebase exports one function `sync`.

```
sync(mapFirebaseToProps, [mergeProps])
```

The `mapFirebaseToProps` function must return an object where the key is the property name, and the value is the firebase query to listen to. It receives the component props.

```
mapFirebaseToProps(props)
```

For example, to sync reference path `/users/5` with component prop `"user"`:

```js
function NormalComponent ({ user }) {
  return <p>{ user.name }</p>
}

const SycnedComponent = sync(
  function (props) {
    return {
      user: firebase.database().ref(`/users/5`)
    }
  }
)(NormalComponent)
```

When the refernce updates in firebase, `NormalComponent` will receive a new `"user"` property. 

### Example

```js
import React, { Component, PropTypes } from "react"
import { sync } from "react-firebase"
import firebase from "firebase"

function addTodo (text) {
  firebase.ref("todos").push().set({ text, done: false })
}

class Todos extends Component {
  static propTypes = {
    todos: PropTypes.object.isRequired,
    addTodo: PropTypes.func.isRequired,
  };
  
  render () {
    // this.props.todos
    // this.props.addTodo
  }
}

function mapFirebase () {
  return {
    todos: firebase.database().ref("todos").limitToFirst(500)
  }
}

export default sync(mapFirebase, { addTodo })(Todos)
```

### Dynamic Queries

The `mapFirebaseToProps` function receives component properties. For example to use `react-router` params.

```js
function mapFirebase ({ params }) {
  return { user: firebase.database().ref(`users/${params.id}`) }
}

@sync(mapFirebase)
class UserProfile extends Component {
  render () {
    return <div>
      { this.props.user.name }
    </div>
  }
}

<Route path={"users/:id"} component={UserProfile} />
```

You can also connect `react-redux` state before syncing with firebase. 

```js
import UserProfile from "./profile.js"
import { connect } from "react-redux"
import { sync } from "react-firebase"

import firebase from "firebase"

export default connect(
  ({ dashboard }) => ({ user: dashboard.user })
)(
  sync(
    ({ user }) => ({
      posts: firebase.database().ref(`posts/${user.id}`),
      comments: firebase.database().ref(`comments/${user.id}`)
    })
  )
)(UserProfile)
```

When using function composition, make sure to combine in the right order.

```js
import { flowRight } from "lodash"

flowRight( connect(), sync() )(Component)
```

When using decorators, make sure to stack in the correct order.

```js
@connect()
@sync()
class Component {}
```

### Default Merge Props

Firebase allows primitive values, which means it would be incorrect to initialize to an empty object. To avoid empty collections breaking required component props, provide a merge property that is overridden with firebase data. 

```js
class Forum extends Component {
  static propTypes = {
    posts: PropTypes.object.isRequired
  };
}

function mapFirebase () {
  return {
    posts: firebase.ref("posts/thread:1231232").limitToFirst(100)
  }
}

sync(mapFirebase, { posts: {} })(Component)
```

The component will receive empty posts to start, and then eventually actual data once it loads. 

### Bind Auth State

The default mapping is to bind on `value`. 

```js
{
  user: firebase.database().ref(`users/5`)
}

// same as

{
  user: {
    query: firebase.database().ref(`users/5`),
    event: "value",
  }
}
```

To bind on auth state, use the pseudo event `auth`.

```js
sync(function () {
  return {
    auth: {
      query: firebase.ref(),
      event: "auth",
    }
  }
})
```

The component will receive `auth` whenever `onAuth` fires. 

### Bind Child Events

If you want to load a collection incrementally, use `child_events`.

```js
sync(function () {
  return {
    items: {
      query: firebase.ref("items"),
      event: "child_events",
    }
  }
}, {
  items: {},
})
```

The component will receive `items` whenever any of `child_added`, `child_removed`, `child_updated` fires. It ignores `child_moved` under the assumption you perform client-side ordering in the render function. 

### Post-Process Data

Sometimes you want to modify the data before it's passed to the component, for example passing into a model constructor or camel-casing the keys. The default `postprocess` is the identity function.

```js
{
  auth: {
    query: firebase.database.ref(),
    event: "auth",
    postprocess: camelCaseKeys,
  }
}
```

### License

MIT
