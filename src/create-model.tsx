import { ModelHook, UseModel } from "./types";
import { Container } from "./container";
import { Executor } from "./executor";
import React, { useEffect, useRef, useState } from "react";
import { render } from "./renderer";

export function createModel<T, P>(hook: ModelHook<T, P>, hookArg?: P) {
  const container = new Container(hook); //实例化容器（可订阅发布操作）
  container.data = hook(hookArg); //将外部hook执行后的返回值加入到容器中（即全局store对象）
  container.notify();
  render(
    //必须要有渲染器，才能使用React语法
    //将元素在渲染器中渲染（模拟react-dom和react-native）
    <Executor
      onUpdate={val => {
        container.data = val; //将外部hook执行后的返回值加入到容器中（即全局store对象）
        container.notify(); //将订阅的方法都执行一次
      }}
      hook={() => hook(hookArg)} //执行外部传入的hook，并将返回值传给onUpdate进行执行
    />
  );
  //自定义hook将会被返回（用于让用户获取全局状态）
  const useModel: UseModel<T> = depsFn => {
    //depsFn: model => [model.count, model.x.y]
    const [state, setState] = useState<T | undefined>(() =>
      container ? container.data : undefined
    ); //用于去容器中的全局状态
    const depsFnRef = useRef(depsFn); //支持传入一个 `depsFn` 函数，来精确控制订阅的字段（性能优化）
    depsFnRef.current = depsFn; //暂存依赖函数
    const depsRef = useRef<unknown[]>(
      depsFnRef.current?.(container.data) || [] //将全局状态store对象作为参数，执行依赖函数（找出在store对象中的依赖属性作为depsRef来缓存）
    );

    //初始化容器
    useEffect(() => {
      if (!container) return;
      function subscriber(val: T) {
        if (!depsFnRef.current) {
          //没有性能优化直接执行
          setState(val);
        } else {
          const oldDeps = depsRef.current; //老依赖
          const newDeps = depsFnRef.current(val); //新依赖
          if (compare(oldDeps, newDeps)) {
            //浅比较（如果不一样则执行）
            setState(val);
          }
          depsRef.current = newDeps; //更新为新依赖
        }
      }
      container.subscribers.add(subscriber); //初始化容器时进行订阅
      return () => {
        container.subscribers.delete(subscriber); //摧毁容器时清除订阅
      };
    }, [container]);

    return state!; //返回容器中的全局状态
  };

  Object.defineProperty(useModel, "data", {
    //useModel.data直接获取状态，不需要进行订阅它的更新
    get: function() {
      return container.data;
    }
  });

  return useModel; //返回该函数
}

export function createLazyModel<T, P>(hook: ModelHook<T, P>, hookArg?: P) {
  let useModel: UseModel<T>;
  const useLazyModel: UseModel<T> = depsFn => {
    if (!useModel) {
      useModel = createModel(hook, hookArg);
    }
    return useModel(depsFn);
  };
  Object.defineProperty(useLazyModel, "data", {
    get: function() {
      return useModel?.data;
    }
  });
  return useLazyModel;
}

function compare(oldDeps: unknown[], newDeps: unknown[]) {
  if (oldDeps.length !== newDeps.length) {
    return true;
  }
  for (const index in newDeps) {
    if (oldDeps[index] !== newDeps[index]) {
      return true;
    }
  }
  return false;
}
