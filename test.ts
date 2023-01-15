import "reflect-metadata";
import os from "os";

console.log("cpu", os.cpus());

function testDecorator(target: any) {
  //   target.name = 1;
  //   console.log("xxxx", Object.getOwnPropertyDescriptor(target, "abc"));
}

function propertyDecorator(target: any, property: string, descriptor: any) {
  console.log("ac", descriptor.value, property);
  const method = descriptor.value;
  Reflect.defineMetadata(
    "metadata",
    [...(Reflect.getMetadata("metadata", target) || []), property],
    target
  );
  descriptor.value = function () {
    console.log("this", this);
  };
  //   Reflect.getOwnMetadata()
  //   descriptor.set = function (v: any) {
  //     Reflect.defineMetadata()
  //     console.log(":bvcc");
  //   };
}
function classDecorator(target: any) {
  Reflect.defineMetadata("hello", "world", target);
}

function Required() {}

class Dependency1 {
  public name: string = "huy";
  constructor() {}
}

// @classDecorator
class Person {
  constructor(private dep1: Dependency1) {}
  //   @propertyDecorator
  // public name: string = "huy";
  // @propertyDecorator
  // public abc(a: string) {
  //   console.log("abc");
  // }
  // @propertyDecorator
  // public huy123() {
  //   console.log("huy123");
  // }
}
// let k:1|string = "3";
let a = new Dependency1();
type K = ConstructorParameters<typeof Person>;
let b: K = [new Dependency1()];
let mapped = {
  a: Dependency1,
};
console.log("aaa", new mapped["a"]());
// a.abc("aaa");
// console.log(global);
console.log(Object.getOwnPropertyNames(Person));
