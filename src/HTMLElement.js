var inherit = require('raptor-util/inherit');
var extend = require('raptor-util/extend');
var Text = require('./Text');
var Comment = require('./Comment');
var Node = require('./Node');

var EMPTY_OBJECT = require('./util').EMPTY_OBJECT;
var ATTR_MARKO_SAME_ID = 'data-marko-same-id';

function HTMLElementClone(other) {
    extend(this, other);
    this.parentNode = undefined;
    this._nextSibling = undefined;
}

function HTMLElement(tagName, attrs, childCount, sameId) {
    var namespaceURI;
    var isTextArea;

    switch(tagName) {
        case 'svg':
            namespaceURI = 'http://www.w3.org/2000/svg';
            break;
        case 'math':
            namespaceURI = 'http://www.w3.org/1998/Math/MathML';
            break;
        case 'textarea':
        case 'TEXTAREA':
            isTextArea = true;
            break;
    }

    Node.call(this, childCount);

    this.attributes = attrs || EMPTY_OBJECT;
    this._isTextArea = isTextArea;
    this.namespaceURI = namespaceURI;
    this.nodeName = tagName;
    this._value = undefined;
    this._sameId = sameId;
}

HTMLElement.prototype = {
    nodeType: 1,

    _nsAware: true,

    cloneNode: function() {
        return new HTMLElementClone(this);
    },

    /**
     * Shorthand method for creating and appending an HTML element
     *
     * @param  {String} tagName    The tag name (e.g. "div")
     * @param  {int|null} attrCount  The number of attributes (or `null` if not known)
     * @param  {int|null} childCount The number of child nodes (or `null` if not known)
     */
    e: function(tagName, attrs, childCount, sameId) {
        var child = this.appendChild(new HTMLElement(tagName, attrs, childCount, sameId));

        if (childCount === 0) {
            return this._finishChild();
        } else {
            return child;
        }
    },

    /**
     * Shorthand method for creating and appending a Text node with a given value
     * @param  {String} value The text value for the new Text node
     */
    t: function(value) {
        this.appendChild(new Text(value));
        return this._finishChild();
    },

    /**
     * Shorthand method for creating and appending a Comment node with a given value
     * @param  {String} value The value for the new Comment node
     */
    c: function(value) {
        this.appendChild(new Comment(value));
        return this._finishChild();
    },

    /**
     * Shorthand method for creating and appending a static node. The provided node is automatically cloned
     * using a shallow clone since it will be mutated as a result of setting `nextSibling` and `parentNode`.
     *
     * @param  {String} value The value for the new Comment node
     */
    n: function(node) {
        this.appendChild(node.cloneNode());
        return this._finishChild();
    },

    actualize: function(document) {
        var el;
        var namespaceURI = this.namespaceURI;
        var tagName = this.nodeName;

        if (namespaceURI) {
            el = document.createElementNS(namespaceURI, tagName);
        } else {
            el = document.createElement(tagName);
        }

        var i;
        var attributes = this.attributes;
        for (var attrName in attributes) {
            var attrValue = attributes[attrName];

            if (attrValue !== false && attrValue != null) {
                if (attrValue === true) {
                    attrValue = '';
                }

                if (attrName === 'xlink:href') {
                    el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attrValue);
                } else {
                    el.setAttribute(attrName, attrValue);
                }
            }
        }

        if (this._isTextArea) {
            el.value = this.value;
        } else {
            var childNodes = this.childNodes;
            if (childNodes) {
                var childCount = childNodes.length;
                for (i=0; i<childCount; ++i) {
                    var childNode = childNodes[i];
                    el.appendChild(childNode.actualize(document));
                }
            }
        }

        if (this._sameId) {
            el.setAttribute(ATTR_MARKO_SAME_ID, this._sameId);
        }

        return el;
    },

    hasAttributeNS: function(namespaceURI, name) {
        // We don't care about the namespaces since the there
        // is no chance that attributes with the same name will have
        // different namespaces
        return this.attributes[name] !== undefined;
    },

    isSameNode: function(otherNode) {
        var sameId = this._sameId;
        if (sameId) {
            var otherSameId = otherNode.actualize ? otherNode._sameId : otherNode.getAttribute(ATTR_MARKO_SAME_ID);
            return sameId === otherSameId;
        } else {
            return false;
        }
    }
};

inherit(HTMLElement, Node);

var proto = HTMLElementClone.prototype = HTMLElement.prototype;

Object.defineProperty(proto, 'checked', {
    get: function () {
        return this.attributes.checked !== undefined;
    }
});

Object.defineProperty(proto, 'selected', {
    get: function () {
        return this.attributes.selected !== undefined;
    }
});

Object.defineProperty(proto, 'id', {
    get: function () {
        return this.attributes.id;
    }
});

Object.defineProperty(proto, 'value', {
    get: function () {
        return this._value || this.attributes.value;
    },
    set: function (value) {
        this._value = value;
    }
});

Object.defineProperty(proto, 'disabled', {
    get: function () {
        return this.attributes.disabled !== undefined;
    }
});

module.exports = HTMLElement;