'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports['default'] = GenericDao;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ServiceLocator = require('./ServiceLocator');

var _ServiceLocator2 = _interopRequireDefault(_ServiceLocator);

var _QueryBuilder = require('./QueryBuilder');

var _QueryBuilder2 = _interopRequireDefault(_QueryBuilder);

function GenericDao(model, qb, discriminators) {
    var sl = _ServiceLocator2['default'].instance;
    sl.registerModel(model.getName(), model);
    var myClass = (function () {
        function myClass(url) {
            _classCallCheck(this, myClass);

            //  this.$injector = $injector;
            //   this.$http     = $injector.get('$http');
            this.url = url;
            this.model = model;
            this.discriminators = discriminators;
        }

        _createClass(myClass, [{
            key: 'setInjector',
            value: function setInjector($injector) {
                this.$injector = $injector;
            }
        }, {
            key: 'getModel',
            value: function getModel() {
                return model;
            }
        }, {
            key: 'createModel',
            value: function createModel(options) {
                return this.create(options);
            }
        }, {
            key: 'query',
            value: function query(q) {
                return qb ? new qb(this, q) : new _QueryBuilder2['default'](this, q);
            }
        }, {
            key: 'getHeaders',
            value: function getHeaders() {
                var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                return opts.headers;
            }
        }, {
            key: 'getOptions',
            value: function getOptions() {
                var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

                opts.headers = this.getHeaders(opts);
                return opts;
            }
        }, {
            key: 'get',
            value: function get() {
                // istanbul ignore next

                var _this = this;

                var qb = arguments.length <= 0 || arguments[0] === undefined ? this.query() : arguments[0];
                var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

                opts = this.getOptions(opts);
                var params = _.merge(opts, { params: qb.opts });
                return this.$http.get(this.url, params).then(function (data) {
                    return _this.extractData(data);
                });
            }
        }, {
            key: 'extractData',
            value: function extractData(data) {
                if (!data.data) {
                    data.data = [];
                }
                return { data: data.data.map(this.build, this) };
            }
        }, {
            key: 'count',
            value: function count() {
                var qb = arguments.length <= 0 || arguments[0] === undefined ? this.query() : arguments[0];
                var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

                opts = this.getOptions();
                var query = this.query(qb.opts);
                query.count();
                return this.get(query, opts);
            }
        }, {
            key: 'build',
            value: function build(data) {
                if (!data) return;
                if (typeof data === 'string') {
                    return data;
                }
                if (Array.isArray(data)) {
                    return data.map(this.build, this);
                }
                if (this.discriminators && data.__t) {
                    var disc = _.find(this.discriminators, { type: data.__t });
                    if (disc) {
                        return new disc(this.$injector, disc.discriminatorUrl, data);
                    }
                }
                return new model(this.$injector, this.url, data);
            }
        }, {
            key: 'create',
            value: function create(params) {
                if (this.discriminators && params.__t) {
                    var disc = _.find(this.discriminators, { type: params.__t });
                    if (disc) {
                        return new disc(this.$injector, disc.discriminatorUrl, params);
                    }
                }
                return new this.model(this.$injector, this.url, params);
            }

            // get discriminators(){
            //   return discriminators
            // }
        }, {
            key: '$http',
            get: function get() {
                return this.$injector.get('$http');
            }
        }]);

        return myClass;
    })();

    function extractId(obj) {
        if (Array.isArray(obj)) return obj.map(extractId);
        if (typeof obj === 'string') return obj;
        /* TODO good idea ?
         if (!obj._id)
         throw 'Cannot find property id of object'; */
        return obj._id;
    }

    _.forIn(model.getModel(), function (value, key) {
        var v = Array.isArray(value) ? value[0] : value;
        if (key === '_id') {
            myClass.prototype['findById'] = myClass.prototype['getById'] = function (value) {
                // istanbul ignore next

                var _this2 = this;

                var qb = arguments.length <= 1 || arguments[1] === undefined ? this.query() : arguments[1];
                var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

                opts = this.getOptions(opts);
                return this.$http.get(this.url + '/' + value, _.merge(opts, { params: qb.opts })).then(function (data) {
                    return new model(_this2.$injector, _this2.url, data.data);
                });
            };
        } else {
            myClass.prototype['selectBy' + _.capitalize(key)] = function (toSelect) {
                var qb = arguments.length <= 1 || arguments[1] === undefined ? this.query() : arguments[1];
                var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

                opts = this.getOptions(opts);
                if (toSelect && toSelect.length) {
                    if (value.ref) {
                        toSelect = extractId(toSelect);
                    }
                    var obj = {};
                    if (typeof toSelect === 'string') {
                        obj[key] = toSelect;
                    } else if (Array.isArray(toSelect)) {
                        obj[key] = toSelect.length === 1 ? toSelect[0] : { $in: toSelect };
                    } else {
                        obj[key] = toSelect;
                    }
                    qb.setQuery(obj);
                }
                return this.get(qb, opts);
            };
        }
        //myClass.prototype
    });

    return myClass;
}

module.exports = exports['default'];