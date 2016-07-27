import { sync } from "../src/index"

import React, { Component } from "react"
import assert from "assert"
import MockRef from "./mockref"
import TestUtils from "react-addons-test-utils"

const render = TestUtils.renderIntoDocument
const findClassName = TestUtils.findRenderedDOMComponentWithClass

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
