import { sync } from "../src/index"

import React, { Component } from "react"
import assert from "assert"
import MockRef from "./mockref"
import TestUtils from "react-addons-test-utils"

class Test extends Component {
  render() {
    return <div>
      <p className={"color"}>{ this.props.color }</p>
      <p className={"name"}>{ this.props.user.name }</p>
    </div>
  }
}

const render = TestUtils.renderIntoDocument
const findClassName = TestUtils.findRenderedDOMComponentWithClass

it("should initialize state", () => {  
  function subscribe () {
    return { user: new MockRef() }
  }
  const Synced = sync(subscribe)(Test)
  const elem = render(<Synced />)
  const name = findClassName(elem, "name")
  assert.equal(name.innerHTML, "")
})

it("should update props on firebase event", () => {
  const ref = new MockRef()
  function subscribe () {
    return { user: ref }
  }
  const Synced = sync(subscribe)(Test)
  const elem = render(<Synced />)
  ref.simulate("value", { name: "AJ" })
  
  const name = findClassName(elem, "name")
  assert.equal(name.innerHTML, "AJ")
})

it("should pass element props", () => {  
  function subscribe() {
    return { user: new MockRef() }
  }
  const Synced = sync(subscribe)(Test)
  const elem = render(<Synced color={"red"} />)
  
  const color = findClassName(elem, "color")
  assert.equal(color.innerHTML, "red")
})

it("should pass extra props", () => {
  function subscribe() {
    return { user: new MockRef() }
  }
  const Synced = sync(subscribe, { color: "blue" })(Test)
  const elem = render(<Synced />)
  
  const color = findClassName(elem, "color")
  assert.equal(color.innerHTML, "blue")
})
