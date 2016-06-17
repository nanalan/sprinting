(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"global.html\">Globals</a>","id":"global","children":[]},{"label":"DRAW","id":"DRAW","children":[{"label":"<a href=\"DRAW.CanvasContext.html\">CanvasContext</a>","id":"DRAW.CanvasContext","children":[]},{"label":"<a href=\"DRAW.DomContext.html\">DomContext</a>","id":"DRAW.DomContext","children":[]},{"label":"<a href=\"DRAW.Shape.html\">Shape</a>","id":"DRAW.Shape","children":[]},{"label":"<a href=\"DRAW.World.html\">World</a>","id":"DRAW.World","children":[]}]},{"label":"<a href=\"Rectangle.html\">Rectangle</a>","id":"Rectangle","children":[]},{"label":"<a href=\"Shape.html\">Shape</a>","id":"Shape","children":[]},{"label":"<a href=\"Sprinting.html\">Sprinting</a>","id":"Sprinting","children":[{"label":"<a href=\"Sprinting.DRAW.html\">DRAW</a>","id":"Sprinting.DRAW","children":[]}]},{"label":"<a href=\"Square.html\">Square</a>","id":"Square","children":[]},{"label":"<a href=\"Thing.html\">Thing</a>","id":"Thing","children":[]},{"label":"<a href=\"World.html\">World</a>","id":"World","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
