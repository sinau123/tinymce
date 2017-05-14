define(
  'ephox.alloy.alien.Descend',

  [
    'ephox.katamari.api.Struct',
    'ephox.sugar.api.node.Node',
    'ephox.sugar.api.node.Text',
    'ephox.sugar.api.search.Traverse'
  ],

  function (Struct, Node, Text, Traverse) {
    var point = Struct.immutable('element', 'offset');

    // NOTE: This only descends once.
    var descendOnce = function (element, offset) {
      var children = Traverse.children(element);
      if (children.length === 0) return point(element, offset);
      else if (offset < children.length) return point(children[offset], 0);
      else {
        var last = children[children.length - 1];
        var len = Node.isText(last) ? Text.get(last).length : Traverse.children(last).length;
        return point(last, len);
      }
    };

    return {
      point: point,
      descendOnce: descendOnce
    };
  }
);
