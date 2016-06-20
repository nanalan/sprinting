(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"Sprinting.html\">Sprinting</a>","id":"Sprinting","children":[{"label":"<a href=\"Sprinting.Circle.html\">Circle</a>","id":"Sprinting.Circle","children":[]},{"label":"<a href=\"Sprinting.Img.html\">Img</a>","id":"Sprinting.Img","children":[]},{"label":"<a href=\"Sprinting.Rectangle.html\">Rectangle</a>","id":"Sprinting.Rectangle","children":[]},{"label":"<a href=\"Sprinting.Shape.html\">Shape</a>","id":"Sprinting.Shape","children":[]},{"label":"<a href=\"Sprinting.Thing.html\">Thing</a>","id":"Sprinting.Thing","children":[]},{"label":"<a href=\"Sprinting.World.html\">World</a>","id":"Sprinting.World","children":[{"label":"<a href=\"Sprinting.World_pointer.html\">pointer</a>","id":"Sprinting.World#pointer","children":[]}]}]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
