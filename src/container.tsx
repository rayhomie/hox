import { ModelHook } from "./types";

type Subscriber<T> = (data: T) => void;

export class Container<T = unknown> {
  constructor(public hook: ModelHook<T>) {}//传入的参数没用
  //原型属性（可被继承）
  subscribers = new Set<Subscriber<T>>();//用于存储地址不同的方法（订阅）
  data!: T;//存放值

  notify() {//（发布）遍历方法进行执行
    for (const subscriber of this.subscribers) {
      subscriber(this.data);
    }
  }
}
