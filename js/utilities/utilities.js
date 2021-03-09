class ValueError extends Error {
    constructor(...args
    )
    {
        super(...args
        )
        Error.captureStackTrace(this, ValueError)
    }
}


$.fn.scrollTo = function (target, options, callback) {
    if (typeof options == 'function' && arguments.length == 2) {
        callback = options;
        options = target;
    }
    var settings = $.extend({
        scrollTarget: target,
        offsetTop: 50,
        duration: 500,
        easing: 'swing'
    }, options);
    return this.each(function () {
        var scrollPane = $(this);
        var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
        scrollPane.animate({scrollTop: scrollY }, parseInt(settings.duration), settings.easing, function () {
            if (typeof callback == 'function') {
                callback.call(this);
            }
        });
    });
}

function array_remove(array_ob, remove_from, remove_to) {
    var rest = array_ob.slice((remove_to || remove_from) + 1 || array_ob.length);
    array_ob.length = remove_from < 0 ? array_ob.length + remove_from : remove_from;
    return array_ob.push.apply(array_ob, rest);
}

/**
 * @desc Shuffles array in place. (https://stackoverflow.com/a/6274381/1097977)
 * @param {Array} a items An array containing the items.
 */
function array_shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

if (!Array.prototype.last_index) {
    Array.prototype.last_index = function() {
        return this.length - 1;
    }
}

if (!Array.prototype.endwards) {
    Array.prototype.endwards = function(negative_index) {
        if (Math.abs(negative_index) > this.length) throw(ValueError("Requested index outside array range"));
        return negative_index < 0 ? this[this.length + negative_index] : this[this.length - negative_index];
    }
}

/**
 * sprintf() method for String primitive that I jacked from stack overflow and then lost the URL to
 */
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

/**
 * toTitleCase method for String primitive
 */
if (!String.prototype.toTitleCase) {
    String.prototype.toTitleCase = function () {
        return this.replace(/\w\S*/g, function (txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
}

//todo: create an "is()" wrapper function for these
/**
 * is_event method
 *
 * @desc Checks for presence of all required attributes of the W3C Specification for an event; returns true if found
 *       see: http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Event
 * @param obj
 * @returns {boolean}
 */
function is_event(obj, message) {
    if (message) {
        pr(obj, "is_event:" + message);
    }

    if (typeof(obj) !== "object") {
        return false;
    }
    var w3cKeys = ["bubbles", "cancelable", "currentTarget", "eventPhase", "timeStamp", "type"];
    for (i in w3cKeys) {
        if (!(w3cKeys[i] in obj)) {
            return false;
        } else {
            return true;
        }
    }
}

function is_object(obj) { return typeof obj === 'object' && obj != null;}

function is_array(obj) { return obj instanceof Array; }

function is_float(n) { return n === +n && n !== (n | 0); }

function is_int(n) { return n === +n && n === (n | 0); }

function is_string(obj) { return typeof(obj) === 'string' }

/**
 *
 * @desc From Michael Martin-Smucker, https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
 * @param str
 * @returns {boolean}
 */
function is_alpha_numeric(str) {
    var code, i, len;

    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
            return false;
        }
    }
    return true;
};
/**
 * isFunction method
 *
 * @desc From Alex Grande, http://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
 * @param obj
 * @returns {boolean}
 */
function is_function(obj) {
    return typeof(obj) === "function";
    var getType = {};
    return obj && getType.toString.call(obj) === '[object Function]';
}

/**
 * isValidJSON method
 * @param string
 * @returns {*}
 */
function is_valid_JSON(string, parseIf) {
    try {
        var o = JSON.parse(string);
        /* Handle non-exception-throwing cases:
		 Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
		 but... JSON.parse(null) returns 'null', and typeof null === "object",
		 so we must check for that, too.
		 - Matt H, http://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string-in-javascript-without-using-try */
        if (o && typeof o === "object" && o !== null) {
            return parseIf === true ? o : true;
        }
    }
    catch (e) {
    }

    return false;
}


/**
 * createCustomEvent method
 *
 * @desc Creates custom jQuery events with standard W3C properties
 * @param eName
 * @param eProperties
 * @returns {*}
 */
function create_custom_event(eName, eProperties) {
    var defaultProps = {"bubbles": true, "cancelable": false, "eventPhase": 0, "type": eName};
    if (typeof(eProperties) == "object") {
        for (var prop in eProperties) {
            if (eProperties.hasOwnProperty(prop)) {
                defaultProps[prop] = eProperties[prop];
            }
        }
    }
    return jQuery.Event(eName, defaultProps);
}


function is_mobile() {
    var check = false;
    (function (a, b) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))check = true})(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}


/**
 * eTypeOf method
 *
 * @desc Provided argument is an event, returns the event's type attribute (string)
 * @param e
 * @returns {type|*}
 */
function e_type_of(e) { return is_event(e) ? e.type : false}


function px_to_int(val) { return Number(val.split("px")[0]);}


/**
 * as_id method
 *
 * @desc
 * @param selector
 * @returns {*}
 */
function as_id(selector) {
    if (typeof(selector) === "string") {
        return selector.substring(0, 1) === "#" ? selector : "#" + selector;
    }
    return false;
}


function camelcase_to_pep8(str) {
    return str_to_lower(str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/([a-z\d])([0-9]{1,})/g, '$1_$2'));
}

function array_intersect(a, b) {
    a = a.sort();
    b = b.sort();
    var ai = bi = 0;
    var result = [];

    while (ai < a.length && bi < b.length) {
        if (a[ai] < b[bi]) {
            ai++;
        } else if (a[ai] > b[bi]) {
            bi++;
        } else {
            result.push(ai);
            ai++;
            bi++;
        }
    }

    return result;
}


function as_class(selector) {
    if (typeof(selector) === "string") {
        return selector.substring(0, 1) === "." ? selector : "." + selector;
    }
    return false;
}


function css_class_join(args) {
    var classes = [];
    $(arguments).each(function() { classes.push(strip_css(this)) });
    return "." + classes.join(".");
}


function sel_to_str(str) {
    try {
        return str.replace("-", " ").replace("_", " ").toTitleCase();
    } catch (e) {
        pr(e, "ERROR:sel_to_str()");
        return str;
    }
}


function now() { return new Date().getTime(); }


function strip_css(selector) {
    return selector.substring(0, 1) == "." || selector.substring(0, 1) == "#" ? selector.substring(1) : selector;
}


function match_window_height(selector, padding) {
    var win_height = window.innerHeight;
    if (Object.prototype.toString.call(padding) === '[object Array]') {
        for (var i = 0; i < padding.length; i++) {
            win_height -= $(padding[i]).innerHeight();
        }
    } else if (typeof(padding) === "int") {
        win_height -= $(padding).innerHeight();
    }
    else if (typeof(padding) === "int") {
        win_height -= padding;
    }
    $(selector).css('min-height', win_height);
    return true;
}


function flash(message) {
    if (message == '@clear') {
        $("#" + 'flash-content').html('');
        return true;
    }
    var m =
        '   <div id="flash-message" class="text-center error">' +
        '       <span>' + message + '</span>' +
        '   </div>';
    $("#" + 'flash-content').html(m);
    return true;
}


function cake_url(controller, action, params, debug) {
    if (params) {
        if (params.constructor === Array) {
            var cakeurl = WWW + DS + APP + DS + controller + DS + action + DS + params.join(DS);
            debug ? pr(cakeurl) : null;
            return cakeurl;
        }
        if (params.constructor === Object) {
            var param_string = '';
            for (p in params) {
                param_string += DS + params[p];
            }
            var cakeurl = WWW + DS + APP + DS + controller + DS + action + param_string;
            debug ? pr(cakeurl) : null;
            return cakeurl;
        }
        var cakeurl = WWW + DS + APP + DS + controller + DS + action + DS + params;
        debug ? pr(cakeurl) : null;
        return cakeurl;
    }
    var cakeurl = WWW + DS + APP + DS + controller + DS + action;
    debug ? pr(cakeurl) : null;
    return cakeurl;
}


/**
 * in_array()
 * @param needle
 * @param haystack
 * @returns {boolean}
 */
function in_array(needle, haystack) { return haystack.indexOf(needle) > -1; }


/**
 * pr method
 *au
 * @desc Elaborated print statement for use with Chrome console
 * @param obj
 * @param label
 * @param error
 * @returns {*}
 */
function pr(obj, label, error) {
    var stacktrace = new Error().stack.split("\n").slice(2);
//		console.log(stacktrace);
    var stack = [];
    var func = "Null";
    var file = "//nowhere";
    var line_no = "-1";
    for (var i = 0; i < stacktrace.length - 1; i++) {
        try {
            func = stacktrace[i].match(/^ at (.*) \(/)[1];
        } catch (e) {}
        try {
            file = "/" + stacktrace[i].match(/^.*\/\/[a-z.-]*\/(.*):[0-9]*:[0-9]*/)[1];
        } catch (e) {}
        ;

        try {
            line_no = stacktrace[i].match(/^.*\/\/[a-z.-]*\/.*:([0-9]*):[0-9]*/)[1];
        } catch (e) {}
        stack.push(func + " in  " + file + ":" + line_no);
    }
    console.log("\nPrinting From: " + stack[0] + "\n");

    var method = error  ? "error" : "log";
    label = !!label && typeof(label) === "string" ? "%c " + label + " " : '%c';
    var note_delim = "*";
    var note_delim_length = note_delim.length;
    var label_bg = "rgb(52, 61, 76)";
    var label_border = "rgb(28, 37 40)";
    var ins_color = "rgb(247, 126, 239)";
    switch (error) {
        case 1:
            var label_css = "color:rgb(255,0,0); text-transform:uppercase; background-color:rgb(255,245,245); border:1px solid rgb(255,0,0);";
            break;
        case 2:
            var label_left_css = "color:rgb(100,160,175); background-color:" + label_bg + "; border:1px solid rgb(35,55,63); border-right:none;";
            var label_center_css = "color:rgb(100,160,175); background-color:" + label_bg + "; border:1px solid rgb(35,55,63); border-left:none, border-right:none;";
            var label_right_css = "color:rgb(100,160,175); background-color:" + label_bg + "; border:1px solid rgb(35,55,63); border-left:none;";
            var label_ins_replace = label.replace("[", "__LBRAC__");
            var label_ins_replace = label_ins_replace.replace("]", "__RBRAC__");
            var label_ins_replace = label_ins_replace.replace(/__LBRAC__(.*)__RBRAC__/, "[%c$1%c]");
            var instances = false;
            var internal_to_method = false;
            if (label != label_ins_replace) {
                label = label_ins_replace;
                instances = true;
            }
            label = label.replace(/\((.*)\)/, "(%c$1%c) %c");
            var meth_label = label.replace(/(#)/, "%c#%c %c");
            if (meth_label != label) {
                internal_to_method = true;
                label = meth_label;
            }
            break;
        default:
            var label_css = "color:rgb(0,150,0); text-transform:uppercase; background-color:rgb(245,245,245); border:1px solid rgb(220,220,220);";
    }
    var type_css = "color:rgb(200,200,200); font-style:italics; display:inline-block; width: 12px; min-width:12px; max-width:12px;";
    var num_css = "color:rgb(0,0,100);";
    var bool_css = "color:rgb(225,125,80); font-weight: bold";
    var str_css = "color:rgb(125,125,125); font-family:arial";
    var note_css = "color:#008cba; background-color:rgb(247,247,247); border:1px solid #008cba;";
    var arg_css = "color:rgb(252,122,0); background-color:" + label_bg + "; border-top:1px solid rgb(35,55,63); border-bottom:1px solid rgb(35,55,63);";
    var ins_css = "color:" + ins_color + "; background-color:" + label_bg + "; border-top:1px solid rgb(35,55,63); border-bottom:1px solid rgb(35,55,63);";
    var msg_css = "color:rgb(252,240,244); background-color:" + label_bg + "; border-top:1px solid rgb(35,55,63); border-bottom:1px solid rgb(35,55,63);";
    var debug = error == 2 || error == 3;
    if (debug) {
        switch (obj) {
            case obj === false:
                label += "%s";
                obj = "false";
                break;
            case obj === true:
                label += "%s";
                obj = "true";
                break;
            case obj === null:
                label += "%s"
                obj = "null"
                break;
            case typeof(obj) === 'undefined':
                label += "%s"
                obj = "undefined"
                break;
            case typeof(obj) === 'number':
                break;
            default:
                label += "%O";
        }
        if (instances) {
            console[method](label, label_left_css, ins_css, label_center_css, arg_css, label_right_css, msg_css, obj);
        } else {
            console[method](label, label_left_css, arg_css, label_right_css, msg_css, obj);
        }
    } else {
        switch (obj) {
            case obj === 0:
                console[method](label + "%c(int) %c", label_css, type_css, num_css, 0);
                break;
            case obj === 1:
                console[method](label + "%c(int) %c%s", label_css, type_css, num_css, 1);
                break
            case obj === false:
                console[method](label + "%c(bool) %c%s", label_css, type_css, bool_css, "false");
                break;
            case obj === true:
                console[method](label + "%c(bool) %c%s", label_css, type_css, bool_css, "true");
                break;
            case obj === null:
                console[method](label + "%c(!def) %c%s", label_css, type_css, bool_css, "null");
                break;
            case typeof(obj) === 'undefined':
                console[method](label + "%c(!def) %c%s", label_css, type_css, bool_css, "undefined");
                break;
            case typeof(obj) === 'string':
                if (obj.substring(0, note_delim_length) === note_delim) {
                    console[method](label + "%c%s", label_css, note_css, " " + obj.substring(1) + " ");
                } else {
                    console[method](label + "%c(str) %c%s", label_css, type_css, str_css, obj);
                }
                break;
            case typeof(obj) === 'number':
                obj % 1 === 0 ? console[method](label + "%c(int) %c%s", label_css, type_css, num_css, obj) : console[method](label + "%c(float) %c%s", label_css, type_css, num_css, obj);
                break;
            default:
                console[method](label + "%c(obj) %O", label_css, type_css, obj);
        }
    }


    return null;
}


/**
 * tr method
 * @desc used for providing a quick and dirty stack trace
 */
function tr(args) { pr(args, "ERROR", 1); }


function func_rep(args, func, debug_mode) {
    if (!debug_mode) return;

    var func_str = "";
    if (is_array(func)) {
        if (is_array(func.endwards(-1))) {
            var arg_str = func.endwards(-1).join(", ");
            func_str += func.slice(0,-1).join(".") + "(" +  arg_str + ")";
        } else {
            func_str = func.join(".")+"()";
        }
    } else {
        pr(2);
        func_str = func;
    }
    pr(args, func_str);
}


/**
 * split_path method
 *
 * @desc Splits a path by <separator> or else forward-slash, striping first trailing and leading slash if found
 * @param path
 * @param separator
 * @returns {*}
 */
function split_path(path, separator) {
    if (typeof(path) != "string") return false;
    // clear trailing & leading slashes
    path = path.substr(-1, 1) === separator ? path.substring(0, path.length - 1) : path;
    path = path.substr(0, 1) === separator ? path.substring(1) : path;

    path = path.replace('\\' + separator, "$DIRECTORY_SEPARATOR").split(separator);
    for (var i = 0; i < path.length; i++) {
        path[i].replace("$DIRECTORY_SEPARATOR", separator);
    }

    return path;
}


function ucfirst(stringName) {
    return stringName.charAt(0).toUpperCase() + stringName.slice(1).toLowerCase();
}


function str_to_lower(stringName) {
    return stringName.toLowerCase()
//	return stringName.charAt(0).toLowerCase() + stringName.slice(1).toLowerCase();
}


function str_to_upper(string_name) {
    return string_name.toUpperCase();
}


function camel_to_snake(str) {
    return str.replace(/([A-Z])/g, function ($1) {return "_" + $1.toLowerCase();});
}


function title_to_snake(str) {
    str = str_to_lower(str[0]) + str.slice(1);
    return str.replace(/([A-Z])/g, function ($1) {return "_" + $1.toLowerCase();});
}


/**
 * snakeify()
 * @desc Turns a passed string into a lower-case, under-scored version of itself. If strict_alphanumeric is true, then supplied
 * strings with non-alphanumeric characters throw a ValueError.
 * @param str
 * @returns {*}
 */
function snakeify(str, strict_alphanumeric) {
    if (typeof(str) != "string") throw new TypeError(`String
	required
	but
	'${typeof(str)}'
	passed`)
        ;
    if (strict_alphanumeric && !is_alpha_numeric(str)) throw new ValueError("Supplied string was not alpha numeric, but 'strict_alphanumeric' was true.");


    return str_to_lower(str.replace(" ", "_"));
}


function title_case(string_name) {
    string_name = string_name.replace('_', ' ').split(' ');
    for (var i = 0; i < string_name.length; i++) string_name[i] = ucfirst(string_name[i]);
    return string_name.join(' ');
}


function flip(bool) {
    if (bool === 0 || bool === 1) {
        return bool == 0;
    }

    if (bool === false || bool === true) {
        return bool == false;
    }

    if (bool === '0' || bool === '1') {
        return bool == '0';
    }

    if (bool === 'true' || bool === 'false') {
        return bool == 'false';
    }

    if (bool === 'True' || bool === 'False') {
        return bool == 'False';
    }

    if (bool === null || bool === 'undefined') {
        return "NULL_NOT_BOOL";
    }
    //todo throw an error here, idiot
    return "BOOLEAN_NOT_PASSED";
}

function integer_keys(obj, as_array) {
    if (!is_object(obj)) return false;
    if (is_array(obj)) return obj
    var new_obj = {}
    for (var key in obj) {
        try {
            new_obj[Number(key)] = obj[key];
        } catch (Exception) {
            new_obj[key] = obj[key];
        }
    }
    return new_obj;
}


function bool_to_int(bool) { return bool ? 1:0}

function obj_values(obj, from, to) {
    var return_array = [];
    var count = -1;
    if (!from) from = 0;
    if (from < 0) from = obj_len(obj) - Math.abs(from);
    if (!to) to = obj_len(obj);
    if (to < 0) to = obj.length - Math.abs(to);
    if (to < from) throw("ValueError: end index cannot precede start index");
    for (var key in obj) {
        count++;
        if (count >= from && count <= to) return_array.push(obj[key]);
    }
    return return_array;
}


function obj_keys(obj) {
    var keys = [];
    for (var k in obj) keys.push(k);
    return keys;
}

function array_to_obj(array) {
    if (!is_array(array)) throw new Error("Argument 'array' must be an array.");
    var obj = {};
    for (var i = 0; i < array.length; i++) obj[i] = array[i];
    return obj;
}

function obj_pop(obj) {
    for (var key in obj) {
        // Uncomment below to fix prototype problem.
        // if (!Object.hasOwnProperty.call(obj, key)) continue;
        var result = obj[key];
        // If the property can't be deleted fail with an error.
        if (!delete obj[key]) { throw new Error(); }
        return result;
    }
}

function obj_key_exists(key, obj) {
    for (var k in obj) if (key == k) return true;
    return false;
}

function exists(varName) {
    return jQuery(varName).length > 0;
}


function clear_form(formId) {
    $("#" + formId)[0].reset();
}



function strpad(padstr, pad_length, padchar, direction, decimal_to) {
    if (typeof(padstr) == "number") padstr = padstr.toString();
    padchar = padchar ? padchar : "0";
    if (decimal_to) {
        var post_decimal = padstr.split(".")[1];
        if (post_decimal && post_decimal.length > 0) {
            padstr += padstr.substring(0, 1) != "." ? "." : null;
            for (var i = 0; i < decimal_to; i++) {
                padstr += toString(0);
            }
        }
    }
    var padchar_count = pad_length - padstr.length;
    if (padchar_count < 1) {
        return padstr;
    }
    var final = '';
    if (direction !== -1) {
        for (var j = 0; j < padchar_count; j++) {
            final += padchar;
        }
        return final + padstr;
    } else {
        for (var j = 0; j < padchar_count; j++) {
            padstr += padchar;
        }
        return padstr;
    }
}


/**
 * form-reset listener
 *
 * @description Any button with the id 'reset-form' will reset the form indicated by it's data-formid attribute
 */
$("#" + "reset-form").click(function () {
    var refresh = $(this).attr('data-refresh');
    var formId = $(this).attr('data-formid');

    if (refresh == false) {
        clear_form();
    } else {
        location.reload();
    }
});

function copy(obj) {
    var new_obj = null;
    if (is_array(obj)) {
        new_obj = Array();
    } else if (typeof(obj) === "string") {
        return "" + obj;
    } else if (is_object(obj)) {
        new_obj = {};
    } else if (isInt(obj) || isFloat(obj)) {
        return 0 + obj
    } else if (obj === true || obj === false) {
        return obj === true;
    } else {
        return null;
    }

    for (var i in obj) { new_obj[i] = obj[i] }
    for (var i in obj.prototype) { new_obj.prototype[i] = obj.prototype[i] }
    return new_obj
}


function obj_len(object) {
    var size = 0, key;
    for (key in object) {
        if (object.hasOwnProperty(key)) size++;
    }
    return size;
}

// stupid-ass function to turn an array into an object whose keys were the array values so I can use ECMA6 "let n in Obj" syntax lolololol
function objectify(arr) {
    if (!is_array(arr)) throw "objectify() requires an array be passed";
    let obj = {};
    for (var i = 0; i < arr.length; i++) obj[arr[i]] = arr[i];
    return obj;
}

function b64JSON(jsobject) {
    return btoa(JSON.stringify(jsobject));
}


function die() {
    function ExitRequest() {
        Error.apply(this, arguments);
        this.name = "ExitRequest";
    }

    ExitRequest.prototype = Object.create(Error.prototype);
    throw new ExitRequest("Exiting..");
}

/**
 * Returns an object with ALL the keys of BOTH objects; values from vals_obj have precedence, otherwise keys_obj values
 * are used.
 *
 * @param keys_obj
 * @param vals_obj
 * @returns {{}}
 */
function obj_merge(keys_obj, vals_obj) {
    if (!is_object(keys_obj) || !is_object(vals_obj)) throw "keys_obj and vals_obj must both be javascript objects";
    var merged_obj = {};
    for (var key in keys_obj) merged_obj[key] = key in vals_obj ? vals_obj[key] : keys_obj[key];
    for (var key in vals_obj) if (!(key in merged_obj)) merged_obj[key] = vals_obj[key];

    return merged_obj;
}

/*** Returns an object with ONLY the keys of keys_obj;  values from vals_obj have precedence, otherwise keys_obj values....*/
function obj_left_join(keys_obj, vals_obj) {
    if (!is_object(keys_obj) || !is_object(vals_obj)) throw "keys_obj and vals_obj must both be javascript objects";
    var joined_obj = copy(keys_obj)
    for (var key in joined_obj) joined_obj[key] = vals_obj[key];

    return joined_obj;
}


function inherits(object) {
    function F() {};
    F.prototype = object.prototype;
    return new F;
}


function strip_orphan_text_nodes(parsed_html_obj) {
    var return_array = [];
    for (var i = 0; i < parsed_html_obj.length; i++) {
        if (parsed_html_obj[i].nodeName != "#text") return_array.push(parsed_html_obj[i]);
    }
    return return_array.length > 1 ? return_array : return_array[0];
}


function defined(obj) { return typeof obj != "undefined" }


function ranged_random(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }


function px_to_vh(px) {
    return px / $(window).height() * 100;
}


function deg_to_px(deg) {
    return deg * 10;
}

const sum = (a, b) => a + b;

function arraySum(arr) {
    return arr.reduce((a, b) => a + b)
}

function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function get_demographic(dem_index, param) {
    return JSON.parse(jsPsych.data.get().values()[dem_index].responses)[param]
}


/* Returns new object, subsetting obj by props  */
function subset_obj(obj, props) {
    const subset = {};
    for (let prop of props) { subset[prop] = obj[prop] }
    return subset;
}

/**
 *
 * @desc From Artjom B., https://stackoverflow.com/questions/28807751/is-it-possible-to-slice-an-object
 * @param obj
 * @param size
 * @returns newObj
 */

function objSlice(obj, size) {
    var filteredKeys = Object.keys(obj).slice(0, size);
    var newObj = {};
    filteredKeys.forEach(function(key){
        newObj[key] = obj[key];
    });
    return newObj;
}

/**
 * Returns new obj, a shuffled form of obj passed
 * Yes, objs don't have an inherent order, but this ensures that to be the case.
 * @desc From ow3n., https://stackoverflow.com/questions/23357980/is-it-possible-to-shuffle-elements-within-an-object-in-javascript
 * @param obj
 * @returns newObj
 */
function shuffleObject(obj){
    // new obj to return
    let newObj = {};
    // create keys array
    var keys = Object.keys(obj);
    // randomize keys array
    keys.sort(function(a,b){return Math.random()- 0.5;});
    // save in new array
    keys.forEach(function(k) {
        newObj[k] = obj[k];
    });
    return newObj;
}

// returns true or false, if probability (prob) provided, used to weight odds of returning true
function coinflip(prob) {
    let p = (defined(prob)) ? prob : 0.5;
    return Math.random() < p;
}

// Given two arrays, returns number of matching elements, order restricted.
function countMatches(a, b) {
    let count = 0;
    for (var i=0; i<a.length; i++) {
        if (a[i] == b[i]) count++;
    }
    return count;
}

// Given numeric array, returns mean of values contained within
function mean(vals) {
    return vals.reduce((a, b) => a + b) / vals.length
}

// Given numeric array, returns SD of values contained within
function sd(vals) {
    let mu = mean(vals)
    let S = 0;
    for (let i=0; i<vals.length;i++) {
        S += Math.pow(vals[i] - mu, 2)
    }
    return Math.sqrt(S)
}

// Given array of rts, returns value equal to mean + 2.5 SDs
function setDuration(rts) {
    mu = mean(rts)
    s2 = sd(rts)
    return mu + (2.5 * s2)
}

// returns array of equal length to passed arrays, where each element is the sum of the respective elements in v1 & v2
function sumVectors(v1, v2) {
    let summed_vector = []
    // Ensure v1 & v2 are both arrays of equal length
    if (v1.length !== v2.length || !is_array(v1) || !is_array(v2)) throw "v1 and v2 must be arrays of equal length";
    // Walk arrays, summing each element pair,
    for (let i=0; i<v1.length; i++) {
        // if either element is 'timeout' skip to next element pair
        if (isNaN(v1[i]) || isNaN(v2[i])) continue;
        // otherwise sum values
        summed_vector.push(sum(v1[i], v2[i]))
    }
    return summed_vector

}

// Given array of objects (haystack) and property name (needle)
// Walks through objects looking for values denoted by needle, and returns new array containing them.
function extract(needle, haystack) {
    let output = [];
    let path = needle.split('/');
    let current_child = null;
    if (!is_array(haystack)) haystack = [haystack];

    for (let i = 0; i< haystack.length; i++) {
        if (is_object(haystack[i])) {
            // if there's no path, don't do extra work
            if (path.length === 1 && obj_key_exists(path[0], haystack[i])) {
                output.push(haystack[i][path[0]]);
                continue;
            }

            for (let j = 0; j < path.length; j++) {
                if (j === 0 && obj_key_exists(path[j], haystack[i])) {
                    current_child = haystack[i][path[j]]
                } else {
                    if (j < path.length -1) {
                        current_child = current_child[path[j]]
                    } else {
                        if (obj_key_exists(path[j], current_child)) output.push(current_child[path[j]])
                    }
                }
            }
        }
    }
    return output;
}

function removeUndefined(arr) {
    let output = arr.filter(function( element ) {
        return element !== undefined;
    });
    return output

}

function getDateTime() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate()
    let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()
    return date + " " + time
}