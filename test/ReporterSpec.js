describe("Reporter", function () {
    describe("Basic HTML reporter", function () {
        var reporter, htmlCanvas, referenceImage, differenceImageCanvas, differenceImageData;

        beforeEach(function () {
            reporter = csscritic.BasicHTMLReporter();

            htmlCanvas = window.document.createElement("canvas");
            referenceImage = new window.Image();
            differenceImageCanvas = window.document.createElement("canvas");
            differenceImageData = differenceImageCanvas.getContext("2d").createImageData(1, 1);
            
            spyOn(csscritic.util, 'getCanvasForImageData').andCallFake(function (differenceImageData) {
                return differenceImageCanvas;
            });
        });

        afterEach(function () {
            $("#csscritic_basichtmlreporter").remove();
        });

        it("should show an entry for the reported test", function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageCanvas: htmlCanvas,
                referenceUrl: "reference_img_url",
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison")).toExist();
        });

        it("should show the page url", function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url<img>",
                pageCanvas: htmlCanvas,
                referenceUrl: "reference_img_url",
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual("page_url<img>");
        });

        describe("Passed tests", function () {

            it("should show an entry as passed", function () {
                reporter.reportComparison({
                    status: "passed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage
                });

                expect($("#csscritic_basichtmlreporter .passed.comparison")).toExist();
            });

            it("should show the status as passed", function () {
                reporter.reportComparison({
                    status: "passed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage
                });

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("passed");
            });

        });

        describe("Failed tests", function () {
            var paramsOnFailingTest, resizePageCanvasSpy;

            beforeEach(function () {
                resizePageCanvasSpy = jasmine.createSpy("resizePageCanvas");

                paramsOnFailingTest = {
                    status: "failed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    resizePageCanvas: resizePageCanvasSpy,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage,
                    differenceImageData: differenceImageData
                };
            });

            it("should show an entry as failed", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .failed.comparison")).toExist();
            });

            it("should show the status as failed", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("failed");
            });

            it("should show the diff on a failing comparison", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .differenceCanvasContainer canvas").get(0)).toBe(differenceImageCanvas);
            });

            it("should show the rendered page for reference and so that the user can save it", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .pageCanvasContainer canvas")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .pageCanvasContainer canvas").get(0)).toBe(htmlCanvas);
            });

            it("should show a caption with the rendered page", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .outerPageCanvasContainer .pageCanvasContainer canvas")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .outerPageCanvasContainer .caption")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .outerPageCanvasContainer .caption").text()).toEqual("Page");
            });

            it("should provide an inner div between page container and canvas for styling purposes", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .pageCanvasContainer .innerPageCanvasContainer canvas")).toExist();
            });

            it("should show the reference image", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .referenceImageContainer img")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .referenceImageContainer img").get(0)).toBe(referenceImage);
            });

            it("should show a caption with the image reference", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .outerReferenceImageContainer .referenceImageContainer img")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .outerReferenceImageContainer .caption")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .outerReferenceImageContainer .caption").text()).toEqual("Reference");
            });

            it("should give help on how to update the reference image", function () {
                reporter.reportComparison(paramsOnFailingTest);

                expect($("#csscritic_basichtmlreporter .comparison .updateHint")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .updateHint")).toHaveClass("warning");
                expect($("#csscritic_basichtmlreporter .comparison .updateHint").text()).toContain("update");
                expect($("#csscritic_basichtmlreporter .comparison .updateHint").text()).toContain("reference_img_url");
            });

            it("should resize the page canvas when user resizes the container", function () {
                reporter.reportComparison(paramsOnFailingTest);

                $("#csscritic_basichtmlreporter .comparison .pageCanvasContainer").css({
                    width: 42,
                    height: 24
                }).trigger("mouseup");

                expect(resizePageCanvasSpy).toHaveBeenCalledWith(42, 24);
            });

        });

        describe("Missing image references", function () {
            var paramsOnMissingReference, resizePageCanvasSpy;

            beforeEach(function () {
                resizePageCanvasSpy = jasmine.createSpy("resizePageCanvas");

                paramsOnMissingReference = {
                    status: "referenceMissing",
                    pageUrl: "page_url<img>",
                    pageCanvas: htmlCanvas,
                    resizePageCanvas: resizePageCanvasSpy,
                    referenceUrl: "reference_img_url"
                };
            });

            it("should show an entry as status 'referenceMissing'", function () {
                reporter.reportComparison(paramsOnMissingReference);

                expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();
            });

            it("should show the status as 'missing reference'", function () {
                reporter.reportComparison(paramsOnMissingReference);

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("missing reference");
            });

            it("should show the rendered page so that the user can save it", function () {
                reporter.reportComparison(paramsOnMissingReference);

                expect($("#csscritic_basichtmlreporter .comparison .pageCanvasContainer canvas")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .pageCanvasContainer canvas").get(0)).toBe(htmlCanvas);
            });

            it("should give help on how to save a reference image", function () {
                reporter.reportComparison(paramsOnMissingReference);

                expect($("#csscritic_basichtmlreporter .comparison .saveHint")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .saveHint")).toHaveClass("warning");
                expect($("#csscritic_basichtmlreporter .comparison .saveHint").text()).toContain("save");
                expect($("#csscritic_basichtmlreporter .comparison .saveHint").text()).toContain("reference_img_url");
            });

            it("should provide an inner div between container and canvas for styling purposes", function () {
                reporter.reportComparison(paramsOnMissingReference);

                expect($("#csscritic_basichtmlreporter .comparison .pageCanvasContainer .innerPageCanvasContainer canvas")).toExist();
            });

            it("should resize the canvas when user resizes the container", function () {
                reporter.reportComparison(paramsOnMissingReference);

                $("#csscritic_basichtmlreporter .comparison .pageCanvasContainer").css({
                    width: 42,
                    height: 24
                }).trigger("mouseup");

                expect(resizePageCanvasSpy).toHaveBeenCalledWith(42, 24);
            });
        });

        describe("Erroneous tests", function () {
            var paramsOnErroneousTest;

            beforeEach(function () {
                paramsOnErroneousTest = {
                    status: "error",
                    pageUrl: "page_url",
                    pageCanvas: null,
                    referenceUrl: "reference_img_url"
                };
            });

            it("should show an entry as erroneous", function () {
                reporter.reportComparison(paramsOnErroneousTest);

                expect($("#csscritic_basichtmlreporter .error.comparison")).toExist();
            });

            it("should show the status is 'error'", function () {
                reporter.reportComparison(paramsOnErroneousTest);

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("error");
            });

            it("should say what the error is about", function () {
                reporter.reportComparison(paramsOnErroneousTest);

                expect($("#csscritic_basichtmlreporter .comparison .errorMsg")).toExist();
                expect($("#csscritic_basichtmlreporter .comparison .errorMsg")).toHaveClass("warning");
                expect($("#csscritic_basichtmlreporter .comparison .errorMsg").text()).toContain("could not be read");
                expect($("#csscritic_basichtmlreporter .comparison .errorMsg").text()).toContain("page_url");
            });

        });

    });
});
