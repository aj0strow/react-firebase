import { sync } from "../src/index"

import React, { Component } from "react"
import assert from "assert"
import MockRef from "./mockref"
import TestUtils from "react-addons-test-utils"

const render = TestUtils.renderIntoDocument
const findClassName = TestUtils.findRenderedDOMComponentWithClass
const { keys } = Object

function content (elem) {
  return elem.innerHTML
}

it("should pass component props", () => {
  function Test ({ color }) {
    return <p className={"color"}>{ color }</p>
  }
  const Sync = sync(null)(Test)
  const elem = render(<Sync color={"red"} />)
  const color = findClassName(elem, "color")
  assert.equal(content(color), "red")
})

it("should pass merge props", () => {
  function Test({ color }) {
    return <p className={"color"}>{ color }</p>
  }
  const Sync = sync(null, { color: "blue" })(Test)
  const elem = render(<Sync />)
  const color = findClassName(elem, "color")
  assert.equal(content(color), "blue")
})

it("should update props on firebase value", () => {
  function Test({ user }) {
    return <p className={"name"}>{ user ? user.name : "..." }</p>
  }
  const ref = new MockRef()
  function mapFirebase() {
    return {
      user: ref,
    }
  }
  const Sync = sync(mapFirebase)(Test)
  const elem = render(<Sync />)
  const name1 = findClassName(elem, "name")
  assert.equal(content(name1), "...")
  const user = {
    name: "AJ"
  }
  ref.simulate("value", user)
  const name2 = findClassName(elem, "name")
  assert.equal(content(name2), "AJ")
})

it("should overwrite default merge props", () => {
  function Test({ user }) {
    return <p className={"name"}>{ user.name }</p>
  }
  const ref = new MockRef()
  function mapFirebase() {
    return {
      user: ref,
    }
  }
  const Sync = sync(mapFirebase, { user: {} })(Test)
  const elem = render(<Sync />)
  const user = {
    name: "Gary"
  }
  ref.simulate("value", user)
  const name = findClassName(elem, "name")
  assert.equal(content(name), "Gary")
})

it("should use default merge prop when null", () => {
  function Test({ user }) {
    return <p className={"name"}>{ user.name }</p>
  }
  const ref = new MockRef()
  function mapFirebase() {
    return {
      user: ref,
    }
  }
  const Sync = sync(mapFirebase, { user: {} })(Test)
  const elem = render(<Sync />)
  const user = {
    name: "Tal"
  }
  ref.simulate("value", user)
  ref.simulate("value", null)
  const name = findClassName(elem, "name")
  assert.equal(content(name), "")
})

it("should bind to auth events", () => {
  function Test({ auth }) {
    return <div>
      { auth ? <p className={"name"}>{ auth.name }</p> : null }
    </div>
  }
  const ref = new MockRef()
  function mapFirebase() {
    return {
      auth: {
        query: ref,
        event: "auth",
      }
    }
  }
  const Sync = sync(mapFirebase)(Test)
  const elem = render(<Sync />)
  assert.throws(() => {
    findClassName(elem, "name")
  }, /class:name/)
  
  ref.emit("auth", { name: "Tal" })
  const name = findClassName(elem, "name")
  assert.equal(content(name), "Tal")
})

it("should bind to child events", () => {
  function Test({ items }) {
    return <div>
    {
      keys(items).map(key => {
        const item = items[key]
        return <p className={"item"} key={item.id}>{ item.name }</p>
      })
    }
    </div>
  }
  const ref = new MockRef()
  function mapFirebase() {
    return {
      items: {
        query: ref,
        event: "child_events",
      }
    }
  }
  const Sync = sync(mapFirebase, { items: {} })(Test)
  const elem = render(<Sync />)
  
  const items = {
    "1": {
      id: "1",
      name: "orange",
    },
    "2": {
      id: "2",
      name: "apple",
    },
  }
  
  function toSnap (key, val) {
    return {
      key() { return key },
      val() { return val },
    }
  }
  
  function getItems() {
    return TestUtils.scryRenderedDOMComponentsWithClass(elem, "item")
  }
  
  ref.emit("child_added", toSnap("1", items["1"]))
  assert.equal(getItems().length, 1)
  
  ref.emit("child_added", toSnap("2", items["2"]))
  assert.equal(getItems().length, 2)
  
  ref.emit("child_updated", toSnap("2", items["2"]))
  assert.equal(getItems().length, 2)
  
  ref.emit("child_removed", toSnap("1", null))
  assert.equal(getItems().length, 1)
})

it("should post process data", () => {
  function Test({ status }) {
    return <p className={"status"}>{ status }</p>
  }
  const ref = new MockRef()
  function mapFirebase () {
    return {
      status: {
        query: ref,
        event: "value",
        postprocess(val) {
          return val.toUpperCase()
        },
      }
    }
  }
  const Sync = sync(mapFirebase)(Test)
  const elem = render(<Sync />)
  ref.simulate("value", "ok")
  
  const status = findClassName(elem, "status")
  assert.equal(content(status), "OK")
})
