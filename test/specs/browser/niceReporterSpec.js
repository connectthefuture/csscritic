describe("Nice reporter", function () {
    "use strict";

    var reporter, selectionFilter;

    var util = csscriticLib.util();

    var originalTitle;

    beforeEach(function () {
        originalTitle = document.title;
    });

    afterEach(function () {
        document.title = originalTitle;
    });

    var anImage;

    beforeEach(function (done) {
        anImage = document.createElement('img');
        anImage.onload = done;
        anImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=";
    });

    var aPassedTest = function (testCase) {
        testCase = testCase || {
            url: "aPage.html"
        };
        return {
            status: "passed",
            testCase: testCase,
            pageImage: anImage,
            referenceImage: anImage,
            renderErrors: []
        };
    };

    var aFailedTest = function (pageImage, referenceImage) {
        return {
            status: 'failed',
            testCase: {
                url: 'aPage.html'
            },
            pageImage: pageImage,
            referenceImage: referenceImage,
            renderErrors: []
        };
    };

    var aFailedTestWithAccept = function (acceptPage) {
        return {
            status: 'failed',
            testCase: {
                url: 'aPage.html'
            },
            pageImage: anImage,
            referenceImage: anImage,
            acceptPage: acceptPage,
            renderErrors: []
        };
    };

    var aMissingReferenceTestWithAccept = function (acceptPage) {
        return {
            status: 'referenceMissing',
            testCase: {
                url: 'aPage.html'
            },
            pageImage: anImage,
            acceptPage: acceptPage,
            renderErrors: []
        };
    };

    var imageData = function () {
        var canvas = document.createElement("canvas");
        return canvas.getContext("2d").createImageData(1, 1);
    };

    var $fixture;

    beforeEach(function () {
        var packageVersion = '1.2.3';
        selectionFilter = jasmine.createSpyObj('selectionFilter', ['filterFor', 'filterUrlFor', 'filterForComponent', 'filterUrlForComponent', 'clearFilter', 'clearFilterUrl']);
        var pageNavigationHandlingFallback = csscriticLib.pageNavigationHandlingFallback({href: 'file://somepath'});

        $fixture = setFixtures();

        reporter = csscriticLib.niceReporter(
            util,
            selectionFilter,
            pageNavigationHandlingFallback,
            rasterizeHTML,
            packageVersion
        ).NiceReporter($fixture.get(0));

        jasmine.addMatchers(imagediffForJasmine2);
    });

    describe("progress bar", function () {
        it("should link to comparison in progress bar", function () {
            var test = aPassedTest();
            reporter.reportSelectedComparison(test);
            reporter.reportComparison(test);

            expect($fixture.find('.progressBar a').attr('href')).toEqual('#aPage.html');
            expect($fixture.find('section').attr('id')).toEqual('aPage.html');
        });

        it("should link to comparison in progress bar with extended test case", function () {
            var test = aPassedTest({url: 'aTest.html', width: 42});
            reporter.reportSelectedComparison(test);
            reporter.reportComparison(test);

            expect($fixture.find('.progressBar a').attr('href')).toEqual('#aTest.html,width=42');
            expect($fixture.find('section').attr('id')).toEqual('aTest.html,width=42');
        });

        it("should expose a title for each blip", function () {
            var test = aPassedTest({url: 'aTest.html', width: 42});
            reporter.reportSelectedComparison(test);
            reporter.reportComparison(test);

            expect($fixture.find('.progressBar a').attr('title')).toEqual('aTest.html,width=42');
        });

        it("should expose a title for each blip with the description if present", function () {
            var test = aPassedTest({url: 'aTest.html', width: 42, desc: 'the description'});
            reporter.reportSelectedComparison(test);
            reporter.reportComparison(test);

            expect($fixture.find('.progressBar a').attr('title')).toEqual('the description');
        });

        it("should expose a title for each blip with the full description if present", function () {
            var test = aPassedTest({url: 'aTest.html', width: 42, desc: 'the description', component: 'something'});
            reporter.reportSelectedComparison(test);
            reporter.reportComparison(test);

            expect($fixture.find('.progressBar a').attr('title')).toEqual('something the description');
        });
    });

    it("should link to the test case's href", function () {
        var test = aPassedTest();
        reporter.reportSelectedComparison(test);
        reporter.reportComparison(test);

        expect($fixture.find('.comparison .title .externalLink').attr('href')).toEqual('aPage.html');
    });

    it("should show a difference canvas on a failed comparison", function (done) {
        testHelper.loadImageFromUrl(testHelper.fixture("blue.png"), function (expectedDiffImage) {
            testHelper.loadImageFromUrl(testHelper.fixture("green.png"), function (pageImage) {
                testHelper.loadImageFromUrl(testHelper.fixture("redWithLetter.png"), function (referenceImage) {
                    var test = aFailedTest(pageImage, referenceImage);
                    reporter.reportSelectedComparison(test);
                    reporter.reportComparison(test);

                    expect($fixture.find('canvas').get(0)).toImageDiffEqual(expectedDiffImage);
                    done();
                });
            });
        });
    });

    it("should allow the user to accept the rendered page on a failing test", function () {
        var acceptSpy = jasmine.createSpy('accept'),
            test = aFailedTestWithAccept(acceptSpy);

        spyOn(imagediff, 'diff').and.returnValue(imageData());

        reporter.reportSelectedComparison(test);
        reporter.reportComparison(test);

        $fixture.find('.failed.comparison button').click();

        expect(acceptSpy).toHaveBeenCalled();
    });

    it("should allow the user to accept the rendered page for a missing reference image", function () {
        var acceptSpy = jasmine.createSpy('accept'),
            test = aMissingReferenceTestWithAccept(acceptSpy);

        spyOn(imagediff, 'diff').and.returnValue(imageData());

        reporter.reportSelectedComparison(test);
        reporter.reportComparison(test);

        $fixture.find('.referenceMissing.comparison button').click();

        expect(acceptSpy).toHaveBeenCalled();
    });

    it("should allow the user to accept all comparisons", function () {
        var firstAccept = jasmine.createSpy('firstAccept'),
            secondAccept = jasmine.createSpy('secondAccept'),
            thirdAccept = jasmine.createSpy('thirdAccept'),
            firstFailingTest = aFailedTestWithAccept(firstAccept),
            secondFailingTest = aFailedTestWithAccept(secondAccept),
            aMissingReferenceTest = aMissingReferenceTestWithAccept(thirdAccept);

        [firstFailingTest, secondFailingTest, aMissingReferenceTest].map(function (comparison) {
            reporter.reportSelectedComparison(comparison);
            reporter.reportComparison(comparison);
        });

        reporter.reportTestSuite({success: false});

        // when
        $fixture.find('.acceptAll').click();

        // then
        expect(firstAccept).toHaveBeenCalled();
        expect(secondAccept).toHaveBeenCalled();
        expect(thirdAccept).toHaveBeenCalled();
    });

    ifNotInPhantomIt("should load the page in an iframe on double click", function () {
        var test = aPassedTest();

        reporter.reportSelectedComparison(test);
        reporter.reportComparison(test);

        // when
        var event = new MouseEvent('dblclick');
        $fixture.find('.imageContainer')[0].dispatchEvent(event);

        // then
        var $iframe = $fixture.find('.imageContainer iframe');
        expect($iframe.length).toBe(1);
        expect($iframe[0].width).toBe('' + anImage.width);
        expect($iframe[0].height).toBe('' + anImage.height);
        expect($iframe[0].src).toMatch(test.testCase.url);
    });

    ifNotInPhantomIt("should hide scrollbars so the exact breakpoint is triggered", function () {
        var test = aPassedTest();

        reporter.reportSelectedComparison(test);
        reporter.reportComparison(test);

        // when
        var event = new MouseEvent('dblclick');
        $fixture.find('.imageContainer')[0].dispatchEvent(event);

        // then
        var $iframe = $fixture.find('.imageContainer iframe');
        expect($iframe.attr('scrolling')).toBe('no');
    });

    describe("selection", function () {

        it("should select tests by url (fallback)", function () {
            var firstPassedTest = aPassedTest({url: "firstTest.html"}),
                secondPassedTest = aPassedTest({url: "secondTest.html"});

            reporter.reportSelectedComparison(firstPassedTest);
            reporter.reportSelectedComparison(secondPassedTest);

            reporter.reportComparison(firstPassedTest);
            reporter.reportComparison(secondPassedTest);

            reporter.reportTestSuite({success: true});

            // when
            $fixture.find('#secondTest\\.html .titleLink').first().click();

            // then
            expect(selectionFilter.filterFor).toHaveBeenCalledWith({url: 'secondTest.html'});
        });

        it("should include test selection url", function () {
            var aTest = aPassedTest({url: "aTest"});

            selectionFilter.filterUrlFor.and.returnValue('the_filter_link');

            reporter.reportSelectedComparison(aTest);
            reporter.reportComparison(aTest);

            expect($fixture.find('.titleLink').attr('href')).toEqual('the_filter_link');
        });

        it("should fallback to hash when selection url is not provided", function () {
            var aTest = aPassedTest({url: "aTest"});

            selectionFilter.filterUrlFor = undefined;

            reporter.reportSelectedComparison(aTest);
            reporter.reportComparison(aTest);

            expect($fixture.find('.titleLink').attr('href')).toEqual('#');
        });

        it("should link from the component headline", function () {
            var aTest = aPassedTest({desc: 'a description', component: 'some component'});
            selectionFilter.filterUrlForComponent.and.returnValue('the_component_filter_link');

            reporter.reportSelectedComparison(aTest);
            reporter.reportComparison(aTest);

            expect($fixture.find('.componentLabel a').attr('href')).toEqual('the_component_filter_link');
        });

        it("should fallback to hash when component selection url is not provided", function () {
            var aTest = aPassedTest({desc: 'a description', component: 'some component'});
            selectionFilter.filterUrlForComponent = undefined;

            reporter.reportSelectedComparison(aTest);
            reporter.reportComparison(aTest);

            expect($fixture.find('.componentLabel a').attr('href')).toEqual('#');
        });

        it("should filter by component headline (fallback)", function () {
            var aTest = aPassedTest({desc: 'a description', component: 'some component'});

            reporter.reportSelectedComparison(aTest);
            reporter.reportComparison(aTest);

            $fixture.find('.componentLabel a').click();

            expect(selectionFilter.filterForComponent).toHaveBeenCalled();
        });

        it("should 'run all'", function () {
            var firstPassedTest = aPassedTest({url: "firstTest.html"}),
                secondPassedTest = aPassedTest({url: "secondTest.html"});

            selectionFilter.clearFilterUrl.and.returnValue('the_clear_url');

            reporter.reportDeselectedComparison(firstPassedTest);
            reporter.reportSelectedComparison(secondPassedTest);

            reporter.reportComparison(secondPassedTest);

            reporter.reportTestSuite({success: true});

            $fixture.find('.runAll').click();

            expect(selectionFilter.clearFilter).toHaveBeenCalled();
        });

        it("should include 'run all' link", function () {
            var firstPassedTest = aPassedTest({url: "firstTest.html"}),
                secondPassedTest = aPassedTest({url: "secondTest.html"});

            selectionFilter.clearFilterUrl.and.returnValue('the_clear_url');

            reporter.reportDeselectedComparison(firstPassedTest);
            reporter.reportSelectedComparison(secondPassedTest);

            reporter.reportComparison(secondPassedTest);

            reporter.reportTestSuite({success: true});

            expect($fixture.find('.runAll').attr('href')).toEqual('the_clear_url');
        });

        it("should fallback to hash on 'run all' link", function () {
            var firstPassedTest = aPassedTest({url: "firstTest.html"}),
                secondPassedTest = aPassedTest({url: "secondTest.html"});

            selectionFilter.clearFilterUrl = undefined;

            reporter.reportDeselectedComparison(firstPassedTest);
            reporter.reportSelectedComparison(secondPassedTest);

            reporter.reportComparison(secondPassedTest);

            reporter.reportTestSuite({success: true});

            expect($fixture.find('.runAll').attr('href')).toEqual('#');
        });
    });

    describe("Document title progress counter", function () {
        it("should show a pending comparison", function () {
            document.title = "a test title";

            reporter.reportSelectedComparison(aPassedTest());

            expect(document.title).toEqual("(0/1) a test title");
        });

        it("should show two pending comparisons", function () {
            document.title = "a test title";

            reporter.reportSelectedComparison(aPassedTest());
            reporter.reportSelectedComparison(aFailedTest());

            expect(document.title).toEqual("(0/2) a test title");
        });

        it("should show one finished comparison", function () {
            var passedTest = aPassedTest();
            document.title = "a test title";

            reporter.reportSelectedComparison(passedTest);
            reporter.reportSelectedComparison(aFailedTest());

            reporter.reportComparison(passedTest);

            expect(document.title).toEqual("(1/2) a test title");
        });

        it("should show one finished comparison", function () {
            var passedTest = aPassedTest(),
                failedTest = aFailedTest(anImage, anImage);
            document.title = "a test title";

            reporter.reportSelectedComparison(passedTest);
            reporter.reportSelectedComparison(failedTest);

            reporter.reportComparison(passedTest);
            reporter.reportComparison(failedTest);

            expect(document.title).toEqual("(2/2) a test title");
        });

        it("should show an empty setup", function () {
            document.title = "a test title";

            reporter.reportTestSuite({success: false});

            expect(document.title).toEqual("(0/0) a test title");
        });
    });

    describe("Browser compatibility warning", function () {
        var fakeCanvas;

        beforeEach(function () {
            fakeCanvas = jasmine.createSpyObj('canvas', ['getContext', 'toDataURL']);
            var fakeContext = jasmine.createSpyObj('context', ['drawImage']);
            fakeCanvas.getContext.and.returnValue(fakeContext);

            var origCreateElement = document.createElement;

            spyOn(document, 'createElement').and.callFake(function (tagName) {
                if (tagName === 'canvas') {
                    return fakeCanvas;
                } else {
                    return origCreateElement.call(document, tagName);
                }
            });
        });

        it("should show a warning if the browser is not supported", function (done) {
            fakeCanvas.toDataURL.and.throwError(new Error('poof'));

            reporter.reportSelectedComparison(aPassedTest());

            testHelper.waitsFor(function () {
                return $(".browserWarning").length > 0;
            }).then(function () {
                expect($(".browserWarning")).toExist();
                done();
            });
        });

        ifNotInPhantomIt("should not show a warning if the browser is supported", function (done) {
            reporter.reportSelectedComparison(aPassedTest());

            // Wait for the opposite until timeout
            testHelper.waitsFor(function () {
                return $(".browserWarning").length > 0;
            }).then(null, function () {
                expect($(".browserWarning")).not.toExist();
                done();
            });
        });
    });
});
