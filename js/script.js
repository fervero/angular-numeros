/*

Copyright (c) 2017, Maciej Bójko.
All rights reserved.

*/

var numeros = angular.module('numeros', ['ngSanitize', 'ngRoute']);

numeros.config(function($routeProvider, $locationProvider) {
               $routeProvider
    .when('/fr', {
        templateUrl: 'view.html',
        controller: 'frenchController'        
    })
    .when('/es', {
        templateUrl: 'view.html',
        controller: 'spanishController'        
    })
    .when('/pl', {
        templateUrl: 'view.html',
        controller: 'polishController'        
    })
    .when('/en', {
        templateUrl: 'view.html',
        controller: 'englishController'        
    })
    .otherwise({
        templateUrl: 'view.html',
        controller: 'frenchController'
    }) 
});

numeros.service('randomService', function() {
    this.short = function() {
        return Math.floor(1 + 999 * Math.random()).toString();
    };
    this.phone = function() {
        return Math.floor(100000000 + 899999999 * Math.random()).toString();
    };
    this.date = function() {
        var start = new Date(1979, 0, 1),
        end = new Date(2020, 11, 31),
        day = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return '' + day.getDate() + '-' + (day.getMonth() + 1) + '-' + day.getFullYear();
    };
    this.fromArray = function(arr) {
        var i = Math.floor(arr.length * Math.random());
        return arr[i];
    }
});

numeros.service('speakerService', ['randomService', function(random) {
    this.initService = function() {
        if (!('speechSynthesis' in window))
            return false;
        if(!(this.speechInitialized)) {
            this.speechInitialized = true;
            this.speaker = window.speechSynthesis;
        }
        this.voices = this.speaker.getVoices();        
        return true;
    }
    this.changeLanguage = function(lang) {
        this.speaker.cancel();
        this.lang = lang;
        this.voices = this.speaker.getVoices();
    }
    var self = this;
    this.voicesChanged = function(e) {
        self.voices = self.speaker.getVoices();
    };
    this.hasTheLanguage = function(lang) {
        lang = lang || this.lang;
        return this.voices.some(function(elem) {
            return (elem.lang) && (elem.lang.startsWith(lang))
        });
    }
    this.randomVoice = function(lang) {
        lang = lang || this.lang;
        var compatibleVoices = this.voices.filter(function(elem) {
            return (elem.lang) && (elem.lang.startsWith(lang));
        });
        return random.fromArray(compatibleVoices);
    }
    this.utterance = function(text, cb) {
        var msg = new SpeechSynthesisUtterance(text);
        msg.lang = this.lang;
        if(cb)
            msg.onstart = cb;
        msg.voice = this.randomVoice();
        return msg;
    }
    this.speak = function(text, cb) {
        this.speaker.cancel();
        this.speaker.speak(this.utterance(text, cb));
    }
}]);

numeros.controller('outsideController', ['$scope', '$window', 'speakerService', function($scope, $window, speaker) {
    $scope.voiceless = !speaker.initService();
}]);

numeros.controller('frenchController', ['$scope', '$window', 'randomService', 'speakerService', function($scope, $window, random, speaker) {
    $scope.lang = 'fr';
    $scope.initSpeak = function() {
        speaker.changeLanguage($scope.lang);
        if (!($scope.hasTheLanguage)) {
            $scope.hasTheLanguage = [];
        }
        $scope.hasTheLanguage[$scope.lang] = $scope.hasTheLanguage[$scope.lang] || speaker.hasTheLanguage();
    };

    $scope.prompt = 'Apprenons les chiffres français&#8239;!';
    $scope.wait = 'En train de chercher une voix française...';
    $scope.successPhrase = "C'est correct.",
    $scope.failurePhrase = "C'est incorrect!";    
    $scope.months = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    $scope.placeholder = $scope.answer = $scope.correctAnswer = '';
    $scope.initSpeak();
    $scope.onvoiceschanged = function() {
        $scope.$apply(function() {
// Looks a little 'quick and dirty', not very Angular, but it does the job.
            speaker.voicesChanged();
            $scope.hasTheLanguage[$scope.lang] = $scope.hasTheLanguage[$scope.lang] || speaker.hasTheLanguage($scope.lang);
        });
    }
    
    $window.speechSynthesis.onvoiceschanged = $scope.onvoiceschanged;
    
    $scope.hasTheLanguage [$scope.lang] = $scope.hasTheLanguage [$scope.lang] || speaker.hasTheLanguage($scope.lang);           
    $scope.updateAnswer = function(answer, placeholder) {
        $scope.answer='';
        $scope.placeholder = placeholder;
        speaker.speak ($scope.correctAnswer = answer);
    }
    $scope.tryShort = function() {
        var short = $scope.formatShort(random.short());
        $scope.updateAnswer(short.pattern, short.placeholder);
        $scope.verify = $scope.verifyShort;
    }
    $scope.tryPhone = function() {
        var phone = $scope.formatPhone(random.phone());
        $scope.updateAnswer(phone.pattern, phone.placeholder);
        $scope.verify = $scope.verifyPhone;
    }
    $scope.tryDate = function() {
        var date = $scope.formatDate(random.date());
        $scope.updateAnswer(date.pattern, date.placeholder);
        $scope.verify = $scope.verifyDate;
    }
    $scope.repeat = function() {
        speaker.speak($scope.correctAnswer);
    }
    $scope.confirm = function() {
        speaker.speak(angular.element(document).find('#verdict').html());
    }
    $scope.formatPhone = function(phone) {
        var stringified = phone.toString().match(/.{1,2}/g).join('-') 
        return {
            pattern: stringified,
            placeholder: stringified.replace(/[0-9]/g,'#')
        };        
    }

    $scope.formatDate = function(date) {
        var splitDate = date.split(/\D/);
        splitDate = splitDate.map(function(x) {return parseInt(x);});
        return {
            pattern: splitDate[0] + ' ' + $scope.months[splitDate[1]] + ' ' + splitDate[2],
            placeholder: 'jj-mm-aaaa'
        }
    }
    $scope.formatShort = function(short) {
        return {
            pattern: short.toString(),
            placeholder: '###'
        }
    }
    $scope.verifyPhone=  function(phone, correct) {
        phone = phone || '0';
        return phone.match(/\d/g).join('') === correct.match(/\d/g).join('');
    }
    $scope.verifyDate = function(date, correct) {
        date = date || '0-0-0';
        return $scope.formatDate(date).pattern === correct;
    }
    $scope.verifyShort = function(short, correct) {
        short = short || '0';
        return $scope.formatShort(short).pattern === $scope.formatShort(correct).pattern;
    }
}]);

numeros.controller ('spanishController', ['$scope', '$window', '$controller', 'randomService', 'speakerService', function($scope, $window, $controller, random, speaker) {
    $controller('frenchController', {$scope: $scope});
    $scope.lang = 'es';
    $scope.prompt = '¡Aprendamos los números en español!';
    $scope.wait = 'Buscando una voz española...';
    $scope.successPhrase = 'Es correcte.',
    $scope.failurePhrase = 'Es incorrecte!';    
    $scope.months = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];   
    $scope.initSpeak();
    $window.speechSynthesis.onvoiceschanged = $scope.onvoiceschanged;
    $scope.formatPhone = function(phone) {
        var stringified = phone.toString().match(/.{1,3}/g).join('-') 
        return {
            pattern: stringified.replace(/-/g, '. '),
            placeholder: stringified.replace(/[0-9]/g,'#')
        };        
    }
}]);

numeros.controller ('polishController', ['$scope', '$window', '$controller', 'randomService', 'speakerService', function($scope, $window, $controller, random, speaker) {
    $controller('spanishController', {$scope: $scope});
    $scope.lang = 'pl';
    $scope.prompt = 'Uczymy się liczb po polsku.';
    $scope.wait = 'Szukam polskiego głosu...';
    $scope.successPhrase = 'Poprawnie.',
    $scope.failurePhrase = 'Niepoprawnie.';    
    $scope.months = ['', 'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia '];    
    $scope.initSpeak();
    $window.speechSynthesis.onvoiceschanged = $scope.onvoiceschanged;
    $scope.formatPhone = function(phone) {
        var stringified = phone.toString().match(/.{1,3}/g).join('-') 
        return {
            pattern: stringified,
            placeholder: stringified.replace(/[0-9]/g,'#')
        };        
    }    
}]);

numeros.controller ('englishController', ['$scope', '$window', '$controller', 'randomService', 'speakerService', function($scope, $window, $controller, random, speaker) {
    $controller('polishController', {$scope: $scope});
    $scope.lang = 'en';
    $scope.prompt = "Let's learn English numbers.";
    $scope.wait = 'Looking for an English voice...';
    $scope.successPhrase = 'Correct.',
    $scope.failurePhrase = 'Incorrect!';    
    $scope.months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    $scope.initSpeak();
    $window.speechSynthesis.onvoiceschanged = $scope.onvoiceschanged;
// As usual, the month-day-year format requires a little bit extra attention.    
    $scope.formatDate = function(date) {
        var splitDate = date.split(/\D/);
        splitDate = splitDate.map(function(x) {return parseInt(x);});
        return {
            pattern: $scope.months[splitDate[1]] + ' ' + splitDate[0] + ' ' + splitDate[2],
            placeholder: 'mm-dd-yyyy'
        }        
    }
    $scope.verifyDate = function(date, correct) {
        date = (date || '0-0-0').split(/\D/);
        if (date.length !== 3) return false;
        date = date[1] + '-' + date[0] + '-' + date[2];
        return $scope.formatDate(date).pattern === correct;
    }
}]);