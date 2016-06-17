(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"Sprinting.html\">Sprinting</a>","id":"Sprinting","children":[{"label":"<a href=\"Sprinting.DRAW.html\">DRAW</a>","id":"Sprinting.DRAW","children":[{"label":"<a href=\"Sprinting.DRAW.CanvasContext.html\">CanvasContext</a>","id":"Sprinting.DRAW.CanvasContext","children":[]},{"label":"<a href=\"Sprinting.DRAW.DomContext.html\">DomContext</a>","id":"Sprinting.DRAW.DomContext","children":[]},{"label":"<a href=\"Sprinting.DRAW.DrawingContext.html\">DrawingContext</a>","id":"Sprinting.DRAW.DrawingContext","children":[]},{"label":"<a href=\"Sprinting.DRAW.Shape.html\">Shape</a>","id":"Sprinting.DRAW.Shape","children":[]},{"label":"<a href=\"Sprinting.DRAW.World.html\">World</a>","id":"Sprinting.DRAW.World","children":[]}]},{"label":"<a href=\"Sprinting.Rectangle.html\">Rectangle</a>","id":"Sprinting.Rectangle","children":[]},{"label":"<a href=\"Sprinting.Shape.html\">Shape</a>","id":"Sprinting.Shape","children":[]},{"label":"<a href=\"Sprinting.Square.html\">Square</a>","id":"Sprinting.Square","children":[]},{"label":"<a href=\"Sprinting.Thing.html\">Thing</a>","id":"Sprinting.Thing","children":[]},{"label":"<a href=\"Sprinting.World.html\">World</a>","id":"Sprinting.World","children":[]}]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
