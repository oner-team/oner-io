## `context.create()`方法的灵活性

示例一：相同的名称空间不必重复书写

```js
// 重复写`systemA`, 可以优化
context.create({
    'systemA.moduleB.getList': {},
    'systemA.moduleC.getList': {}
});
// 把`systemA`提取出来
context.create('systemA', {
    'moduleB.getList': {},
    'moduleC.getList': {}
});
```

示例二：多级的相同的名称空间不必重复书写

```js
// 重复写`systemA.moduleB`, 可以优化
context.create({
    'systemA.moduleB.getListA': {},
    'systemA.moduleB.getListB': {}
});
// 把`systemA.moduleB`提取出来
context.create('systemA.moduleB', {
    'getListA': {},
    'getListB': {}
});
```
