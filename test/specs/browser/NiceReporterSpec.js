describe("Nice reporter", function () {
    "use strict";

    var reporter;

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

    var reporterContainer = function () {
        return $('#csscritic_nicereporter');
    };

    beforeEach(function () {
        reporter = csscriticLib.niceReporter(util).NiceReporter();
        jasmine.addMatchers(imagediffForJasmine2);
    });

    afterEach(function () {
        reporterContainer().remove();
    });

    it("should link to comparison in progress bar", function () {
        var test = aPassedTest();
        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        expect(reporterContainer().find('#progressBar a').attr('href')).toEqual('#aPage.html');
        expect(reporterContainer().find('section').attr('id')).toEqual('aPage.html');
    });

    it("should link to comparison in progress bar with extended test case", function () {
        var test = aPassedTest({url: 'aTest.html', width: 42});
        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        expect(reporterContainer().find('#progressBar a').attr('href')).toEqual('#aTest.html,width=42');
        expect(reporterContainer().find('section').attr('id')).toEqual('aTest.html,width=42');
    });

    it("should link to the test case's href", function () {
        var test = aPassedTest();
        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        expect(reporterContainer().find('.comparison .title a').attr('href')).toEqual('aPage.html');
    });

    it("should show a difference canvas on a failed comparison", function (done) {
        testHelper.loadImageFromUrl(testHelper.fixture("blue.png"), function (expectedDiffImage) {
            testHelper.loadImageFromUrl(testHelper.fixture("green.png"), function (pageImage) {
                testHelper.loadImageFromUrl(testHelper.fixture("redWithLetter.png"), function (referenceImage) {
                    var test = aFailedTest(pageImage, referenceImage);
                    reporter.reportComparisonStarting(test);
                    reporter.reportComparison(test);

                    expect(reporterContainer().find('canvas').get(0)).toImageDiffEqual(expectedDiffImage);
                    done();
                });
            });
        });
    });

    it("should allow the user to accept the rendered page on a failing test", function () {
        var acceptSpy = jasmine.createSpy('accept'),
            test = aFailedTestWithAccept(acceptSpy);

        spyOn(imagediff, 'diff').and.returnValue(imageData());

        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        reporterContainer().find('.failed.comparison button').click();

        expect(acceptSpy).toHaveBeenCalled();
    });

    it("should allow the user to accept the rendered page for a missing reference image", function () {
        var acceptSpy = jasmine.createSpy('accept'),
            test = aMissingReferenceTestWithAccept(acceptSpy);

        spyOn(imagediff, 'diff').and.returnValue(imageData());

        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        reporterContainer().find('.referenceMissing.comparison button').click();

        expect(acceptSpy).toHaveBeenCalled();
    });

    describe("Document title progress counter", function () {
        it("should show a pending comparison", function () {
            document.title = "a test title";

            reporter.reportComparisonStarting(aPassedTest());

            expect(document.title).toEqual("(0/1) a test title");
        });

        it("should show two pending comparisons", function () {
            document.title = "a test title";

            reporter.reportComparisonStarting(aPassedTest());
            reporter.reportComparisonStarting(aFailedTest());

            expect(document.title).toEqual("(0/2) a test title");
        });

        it("should show one finished comparison", function () {
            var passedTest = aPassedTest();
            document.title = "a test title";

            reporter.reportComparisonStarting(passedTest);
            reporter.reportComparisonStarting(aFailedTest());

            reporter.reportComparison(passedTest);

            expect(document.title).toEqual("(1/2) a test title");
        });

        it("should show one finished comparison", function () {
            var passedTest = aPassedTest(),
                failedTest = aFailedTest(anImage, anImage);
            document.title = "a test title";

            reporter.reportComparisonStarting(passedTest);
            reporter.reportComparisonStarting(failedTest);

            reporter.reportComparison(passedTest);
            reporter.reportComparison(failedTest);

            expect(document.title).toEqual("(2/2) a test title");
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

            reporter.reportComparisonStarting(aPassedTest());

            setTimeout(function () {
                expect($(".browserWarning")).toExist();

                done();
            }, 100);
        });

        ifNotInPhantomIt("should not show a warning if the browser is supported", function (done) {
            reporter.reportComparisonStarting(aPassedTest());

            setTimeout(function () {
                expect($(".browserWarning")).not.toExist();

                done();
            }, 100);
        });
    });
});
