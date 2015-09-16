var expect = require('chai').expect;
var request = require('request');

var db = require('../app/config');
var Users = require('../app/collections/users');
var User = require('../app/models/user');
var Links = require('../app/collections/links');
var Link = require('../app/models/link');

setTimeout(function() {
  describe('', function() {

    beforeEach(function() {
      // log out currently signed in user
      request('http://127.0.0.1:4568/logout', function(error, res, body) {});

      // delete link for roflzoo from db so it can be created later for the test
      db.knex('urls')
        .where('url', '=', 'http://roflzoo.com/')
        .del()
        .catch(function(error) {
          throw {
            type: 'DatabaseError',
            message: 'Failed to create test setup data'
          };
        });

      // delete user Svnh from db so it can be created later for the test
      db.knex('users')
        .where('username', '=', 'Svnh')
        .del()
        .catch(function(error) {
          // uncomment when writing authentication tests
          // throw {
          //   type: 'DatabaseError',
          //   message: 'Failed to create test setup data'
          // };
        });

      // delete user Phillip from db so it can be created later for the test
      db.knex('users')
        .where('username', '=', 'Phillip')
        .del()
        .catch(function(error) {
          // uncomment when writing authentication tests
          // throw {
          //   type: 'DatabaseError',
          //   message: 'Failed to create test setup data'
          // };
        });
    });

    describe('Link creation:', function(){

      var requestWithSession = request.defaults({jar: true});

      beforeEach(function(done){
        // create a user that we can then log-in with
        Users.create({
            'username': 'Phillip',
            'password': 'Phillip'
        }).then(function(){
          var options = {
            'method': 'POST',
            'followAllRedirects': true,
            'uri': 'http://127.0.0.1:4568/login',
            'json': {
              'username': 'Phillip',
              'password': 'Phillip'
            }
          };
          // login via form and save session info
          requestWithSession(options, function(error, res, body) {
            done();
          });
        });
      });

      it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/links',
          'json': {
            'url': 'definitely not a valid url'
          }
        };

        requestWithSession(options, function(error, res, body) {
          // res comes from the request module, and may not follow express conventions
          expect(res.statusCode).to.equal(404);
          done();
        });
      });

      describe('Shortening links:', function(){

        var options = {
          'method': 'POST',
          'followAllRedirects': true,
          'uri': 'http://127.0.0.1:4568/links',
          'json': {
            'url': 'http://roflzoo.com/'
          }
        };

        it('Responds with the short code', function(done) {
          requestWithSession(options, function(error, res, body) {
            expect(res.body.url).to.equal('http://roflzoo.com/');
            expect(res.body.code).to.not.be.null;
            done();
          });
        });

        it('New links create a database entry', function(done) {
          requestWithSession(options, function(error, res, body) {
            db.knex('urls')
              .where('url', '=', 'http://roflzoo.com/')
              .then(function(urls) {
                if (urls['0'] && urls['0']['url']) {
                  var foundUrl = urls['0']['url'];
                }
                expect(foundUrl).to.equal('http://roflzoo.com/');
                done();
              });
          });
        });

        it('Fetches the link url title', function (done) {
          requestWithSession(options, function(error, res, body) {
            db.knex('urls')
              .where('title', '=', 'Funny pictures of animals, funny dog pictures')
              .then(function(urls) {
                if (urls['0'] && urls['0']['title']) {
                  var foundTitle = urls['0']['title'];
                }
                expect(foundTitle).to.equal('Funny pictures of animals, funny dog pictures');
                done();
              });
          });
        });

      }); // 'Shortening links'

      describe('With previously saved urls:', function(){

        var link;

        beforeEach(function(done){
          // save a link to the database
          link = new Link({
            url: 'http://roflzoo.com/',
            title: 'Funny pictures of animals, funny dog pictures',
            base_url: 'http://127.0.0.1:4568'
          });
          link.save().then(function(){
            done();
          });
        });

        it('Returns the same shortened code', function(done) {
          var options = {
            'method': 'POST',
            'followAllRedirects': true,
            'uri': 'http://127.0.0.1:4568/links',
            'json': {
              'url': 'http://roflzoo.com/'
            }
          };

          requestWithSession(options, function(error, res, body) {
            var code = res.body.code;
            expect(code).to.equal(link.get('code'));
            done();
          });
        });

        it('Shortcode redirects to correct url', function(done) {
          var options = {
            'method': 'GET',
            'uri': 'http://127.0.0.1:4568/' + link.get('code')
          };

          requestWithSession(options, function(error, res, body) {
            var currentLocation = res.request.href;
            expect(currentLocation).to.equal('http://roflzoo.com/');
            done();
          });
        });

        it('Returns all of the links to display on the links page', function(done) {
          var options = {
            'method': 'GET',
            'uri': 'http://127.0.0.1:4568/links'
          };

          requestWithSession(options, function(error, res, body) {
            expect(body).to.include('"title":"Funny pictures of animals, funny dog pictures"');
            expect(body).to.include('"code":"' + link.get('code') + '"');
            done();
          });
        });

      }); // 'With previously saved urls'

    }); // 'Link creation'

    describe('Privileged Access:', function(){

      it('Renders login page if a user tries to access the main page and is not signed in', function(done) {
        request('http://127.0.0.1:4568/', function(error, res, body) {
          expect(body).to.contain('Login');
          done();
        });
      });

      it('Renders login page if a user tries to create a link and is not signed in', function(done) {
        request('http://127.0.0.1:4568/create', function(error, res, body) {
          expect(body).to.contain('You must be logged in to access this resource');
          done();
        });
      });

      it('Renders login page if a user tries to see all of the links and is not signed in', function(done) {
        request('http://127.0.0.1:4568/links', function(error, res, body) {
          expect(body).to.contain('You must be logged in to access this resource');
          done();
        });
      });

    }); // 'Priviledged Access'

    describe('Account Creation:', function(){

      it('Signup creates a user record', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/signup',
          'json': {
            'username': 'Svnh',
            'password': 'Svnh'
          }
        };

        request(options, function(error, res, body) {
          db.knex('users')
            .where('username', '=', 'Svnh')
            .then(function(res) {
              if (res[0] && res[0]['username']) {
                var user = res[0]['username'];
              }
              expect(user).to.equal('Svnh');
              done();
            }).catch(function(err) {
              throw {
                type: 'DatabaseError',
                message: 'Failed to create test setup data'
              };
            });
        });
      });

      it('Signup logs in a new user', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/signup',
          'json': {
            'username': 'Phillip',
            'password': 'Phillip'
          }
        };

        request(options, function(error, res, body) {
          expect(res.headers.location).to.equal('/create');
          done();
        });
      });

    }); // 'Account Creation'

    describe('Account Login:', function(){

      var requestWithSession = request.defaults({jar: true});

      beforeEach(function(done){
        // create a user that we can then log-in with
        Users.create({
            'username': 'Phillip',
            'password': 'Phillip'
        }).then(function(){
          var options = {
            'method': 'POST',
            'followAllRedirects': true,
            'uri': 'http://127.0.0.1:4568/login',
            'json': {
              'username': 'Phillip',
              'password': 'Phillip'
            }
          };
          // login via form and save session info
          requestWithSession(options, function(error, res, body) {
            request('http://127.0.0.1:4568/logout', function(error, res, body) {});
            done();
          });
        });
      });

      it('Logs in existing users', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/login',
          'json': {
            'username': 'Phillip',
            'password': 'Phillip'
          }
        };

        requestWithSession(options, function(error, res, body) {
          expect(res.headers.location).to.equal('/create');
          done();
        });
      });

      it('Users that do not exist are kept on login page', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/login',
          'json': {
            'username': 'Fred',
            'password': 'Fred'
          }
        };

        requestWithSession(options, function(error, res, body) {
          expect(body).to.contain('Invalid username or password');
          done();
        });
      });

      it('Should lock out users that login unsuccessfully 3 times in a row', function(done) {
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/login',
          'json': {
            'username': 'Fred',
            'password': 'Fred'
          }
        };

        requestWithSession(options, function(error, res, body) {
          requestWithSession(options, function(error, res, body) {
            requestWithSession(options, function(error, res, body) {
              expect(body).to.contain('before attempting to login again');
              done();
            });
          });
        });
      });

      it('Should login users so that the next test can run without being locked out', function(done) {
        this.timeout(7000);
        setTimeout(function() {
          var options = {
            'method': 'POST',
            'uri': 'http://127.0.0.1:4568/login',
            'json': {
              'username': 'Phillip',
              'password': 'Phillip'
            }
          };

          requestWithSession(options, function(error, res, body) {
            done();
          });
        }, 5000);
      });

      it('Should lock out users that login unsuccessfully 3 times in a row and then log the user in when they finally type in their password correctly', function(done) {
        this.timeout(7000);
        var options = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/login',
          'json': {
            'username': 'Fred',
            'password': 'Fred'
          }
        };

        goodOptions = {
          'method': 'POST',
          'uri': 'http://127.0.0.1:4568/login',
          'json': {
            'username': 'Phillip',
            'password': 'Phillip'
          }
        };

        requestWithSession(options, function(error, res, body) {
          requestWithSession(options, function(error, res, body) {
            requestWithSession(options, function(error, res, body) {
              setTimeout(function() {
                requestWithSession(goodOptions, function(error, res, body) {
                  expect(res.headers.location).to.equal('/create');
                  done();
                });
              }, 5000);
            });
          });
        });
      });

    }); // 'Account Login'
  }); // 'Account Login'



  run();
}, 1500);