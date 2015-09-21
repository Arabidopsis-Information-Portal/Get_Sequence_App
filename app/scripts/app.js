/* global Sequence, Nt, _ */
/* jshint camelcase: false */
(function(window, $, _, undefined) {
    'use strict';

    console.log('Welcome to the GetSequence App!');

    var appContext = $('[data-app-name="getSequence-app"]');

    window.addEventListener('Agave::ready', function() {

    // Initialize some variables
    var Agave = window.Agave;
    var geneIdentifier = '';
    var flankLength = 0;
    var revSeq = false;
    var lowerCase = false;
    var chromosomeId = '';
    var startCoordinate = 0;
    var endCoordinate = 0;
    var curr_id, curr_seq; //for download purposes
    var chromloc = '';
    var sequenceIdentifier = 'Sequence';
    var fullSequenceIdentifier = 'Sequence';
    var orig_sequence='';
    var thalemine_user = {};

    var DEBUG = true;
    var log = function log( message ) {
        if ( DEBUG ) {
            console.log( message );
        }
    };

    // Start notification
    var init = function init() {
        log( 'Initializing sequence app...' );
    };

    // templates
    var templates = {
        geneTable: _.template('<table class="table table-striped table-bordered gene-table">' +
                              '<thead><tr>' +
                              '<th>Gene</th>' +
                              '<th>Location</th>' +
                              '<th>Start</th>' +
                              '<th>End</th>' +
                              '<th>Strand</th>' +
                              '<th></th>' +
                              '</tr></thead><tbody>' +
                              '<% _.each(result, function(r) { %>' +
                              '<tr>' +
                              '<td><%= r.locus %><a href="#gene-report" tabindex="0" role="button" data-toggle="popover" data-trigger="focus" data-locus="<%= r.locus %>" class="btn btn-link btn-sm"><i class="fa fa-info-circle fa-lg"></i></a></td>' +
                              '<td><%= r.location %></td>' +
                              '<td><%= r.start %></td>' +
                              '<td><%= r.end %></td>' +
                              '<td><%= r.strand %></td>' +
                              '<td><button type="button" class="btn btn-primary" id="view_sequence" data-locus="<%= r.locus %>">View Sequence</button></td>' +
                              '</tr>' +
                              '<% }) %>' +
                              '</tbody>' +
                              '</table>'),
        geneReportPopover: _.template('<% _.each(properties, function(prop) { %>' +
                                      '<h3><%= prop.type.replace("_"," ") %></h3>' +
                                      '<p><%= prop.value %></p>' +
                                      '<% }) %>'),
    };

    /* - - - - - - - - - -  */
    /* Write error messages */
    /* - - - - - - - - - -  */
    var infoMessage = function infoMessage(message) {
        return '<div class="alert alert-info fade in" role="alert">' +
               '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
               '<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span><span class="sr-only">Warning:</span> ' +
               message + '</div>';
    };

    var warningMessage = function warningMessage(message) {
        return '<div class="alert alert-warning fade in" role="alert">' +
               '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
               '<span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span><span class="sr-only">Warning:</span> ' +
               message + '</div>';
    };

    var errorMessage = function errorMessage(message) {
        return '<div class="alert alert-danger fade in" role="alert">' +
               '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
               '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span><span class="sr-only">Error:</span> ' +
               message + '</div>';
    };

    var showError = function(err) {
        $('.wait_region').empty();
        $('.error', appContext).html(errorMessage('Error interacting with the server [' + err.obj.message + ']! Please try again later.'));
        console.error('Status: ' + err.obj.status + '  Message: ' + err.obj.message);
    };

    var showError2 = function(err) {
        $('.wait_region2').empty();
        $('.error', appContext).html(errorMessage('Error interacting with the server [' + err.obj.message + ']! Please try again later.'));
        console.error('Status: ' + err.obj.status + '  Message: ' + err.obj.message);
    };

    var showError3 = function(err) {
        $('.wait_region3').empty();
        $('.error', appContext).html(errorMessage('Error interacting with the server [' + err.obj.message + ']! Please try again later.'));
        console.error('Status: ' + err.obj.status + '  Message: ' + err.obj.message);
    };

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /* Wrapper function for retrieving and displaying of the sequence by identifier */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    var wrapperSequenceByIdentifier = function wrapperSequenceByIdentifier(json) {
        // Verify the API query was successful
        if ( ! (json && json.obj) || json.obj.status !== 'success') {
            $('.identifier_results', appContext).html(errorMessage('Error with sequence retrieval!'));
            return;
        }

        var returnedSequences = processSequenceResults(json);
        // The search is done, hide the waiting bar
        $('.wait_region').empty();
        $('.error').empty();

        // Display the sequence
        var lineLength = $('#seqLineLengthI').val();
        mySequenceI = displaySequence(mySequenceI, returnedSequences[0], returnedSequences[1], '#identifier_results', IUID, lineLength);
        enableIdentSequenceDisplayButtons();
    };


    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /* Wrapper function for retrieving and displaying of the sequence by location   */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    var wrapperSequenceByLocation = function wrapperSequenceByLocation(json) {
        // Verify the API query was successful
        if ( ! (json && json.obj) || json.obj.status !== 'success') {
            $('.location_results', appContext).html(errorMessage('Error with sequence retrieval!'));
            return;
        }

        var returnedSequences = processSequenceResults(json);
        // The search is done, hide the waiting bar
        $('.wait_region2').empty();
        $('.error').empty();

        // Display the sequence
        var lineLength = $('#seqLineLengthL').val();
        mySequenceL = displaySequence(mySequenceL, returnedSequences[0], returnedSequences[1], '#location_results', LUID, lineLength);
        enableLocSequenceDisplayButtons();
    };

    // gene report handler
    var geneReportHandler = function geneReportHandler() {
        $('a[href=#gene-report]', appContext).on('click', function(e) {
            e.preventDefault();
            var el = $(this);
            var locus = el.attr('data-locus');
            if (locus.indexOf('.') !== -1) {
                locus = locus.slice(0, locus.indexOf('.'));
            }
            var query = { locus: locus };
            Agave.api.adama.search(
                {'namespace': 'aip', 'service': 'locus_gene_report_v0.2.0', 'queryParams': query},
                function(search) {
                    el.popover({title: 'Gene Report: ' + locus,
                                content: templates.geneReportPopover(search.obj.result[0]),
                                trigger: 'manual',
                                html: true,
                                template: '<div class="popover popover-definition" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'});
                    el.popover('toggle');
                    $('.close').remove();
                    $('.popover-title').append('<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
                    $('.close').click(function () {
                        $(this).parents('.popover').popover('hide');
                    });
                }
            );
        });
    };

    var getUserName = function getUserName() {
        return thalemine_user.username.replace('ARAPORT:', '') + ' (' + thalemine_user.preferences.aka + ')';
    };

    var showGeneResults = function showGeneResults(json) {
        // Verify the API query was successful
        if ( ! (json && json.obj) || json.obj.status !== 'success') {
            $('.gene_list_results', appContext).html(errorMessage('Error with retrieval of genes!'));
            return;
        }

        // The search is done, hide the waiting bar
        $('.wait_region3').empty();
        $('.error').empty();

        $('.gene_list_results', appContext).html(templates.geneTable(json.obj));

        geneReportHandler();

        var gTable = $('.gene_list_results table', appContext).DataTable( {'lengthMenu': [10, 25, 50, 100],
                                                                           'columnDefs': [{'targets': 5,
                                                                                           'searchable': false,
                                                                                           'orderable': false,
                                                                                           'width': '40px'}]} );

        if (gTable.data().length > 0) {
            $('div.gene_list_results', appContext).prepend('<button type="button" class="btn btn-default export-button" id="export_list">Export as List to ThaleMine</button>');
        }

        Agave.api.adama.search(
            {'namespace': 'eriksf-dev', 'service': 'get_thalemine_user_v0.1'},
            function (search) {
                thalemine_user = search.obj.result[0];
            }
        );

        $('.gene_list_results', appContext).on('click', '#export_list', function (e) {
            e.preventDefault();
            var ids = [];
            gTable.column(0).data().each(function (value) {
                ids.push($($.parseHTML(value)).text());
            });

            var id_str = ids.join(' ');
            var list_name = 'Genes_on_' + $('#gene_chromosomeId').val() + '_between_' + $('#geneStartCoordinate').val() + '_and_' + $('#geneEndCoordinate').val() + '-' + new Date().toISOString();
            var params = {
                name: list_name,
                type: 'Gene',
                data: id_str
            };
            Agave.api.adama.search(
                {'namespace': 'eriksf-dev', 'service': 'create_list_v0.1', 'queryParams': params},
                function (search) {
                    if ( ! (search && search.obj) || search.obj.status !== 'success' || ! search.obj.result[0].wasSuccessful) {
                        var msg = 'Error creating list ' + list_name + ' for user ' +  getUserName() + ' in ThaleMine. Please try again later!';
                        $('.error', appContext).html(errorMessage(msg));
                        console.error(msg);
                        return;
                    }
                    $('.error', appContext).html(infoMessage('List ' + list_name + ' created for user ' + getUserName() + ' in ThaleMine!'));
                },
                function (err) {
                    var msg = 'Error creating list ' + list_name + ' for user ' +  getUserName() + ' in ThaleMine. Please try again later!';
                    $('.error', appContext).html(errorMessage(msg));
                    console.error(msg + ': ' + err);
                }
            );
        });

        $('.gene_list_results table', appContext).on('click', '#view_sequence', function (e) {
            e.preventDefault();
            var el = $(this);
            var locus = el.attr('data-locus');

            // set gene identifier from button and submit form
            $('a[href="#d_identifier"]', appContext).tab('show');
            $('#geneIdentifier', appContext).val(locus);
            $('#id_submit', appContext).submit();
        });
    };


    /* - - - - - - - - - - - - - - - - - - - - - - -*/
    /* Process function for the sequence search - - */
    /* - - - - - - - - - - - - - - - - - - - - - - -*/
    function processSequenceResults( json ) {

        // Begin parsing json
        var data = json.obj || json;

        // Extract the sequence
        var sequence = data.result[0].sequence;
        var start = data.result[0].start;
        var s_adjust;
        if(start < 1) {
            start = 1;
            s_adjust = 1;
        } else {
            s_adjust = start + 1;
        }

        var end = data.result[0].end;
        var chromosome = data.result[0].chromosome;
        var id =  'Sequence ' + ' Location=' + chromosome + '..' + s_adjust + '-' + end + ' ReverseComplemented=false';

        // return sequences and ids
        orig_sequence = sequence.toUpperCase();

        chromosomeId = chromosome;
        startCoordinate = start;
        endCoordinate = end;
        chromloc = chromosome + '..' + s_adjust + '-' + end;
        return [orig_sequence,id,chromosome,start,end];
    }

    /* - - - - - - - - - - - - - - - - - - - - - - */
    /* Reverse complement the sequence - - - - - - */
    /* - - - - - - - - - - - - - - - - - - - - - - */
    function processRevComp(seq, chr, start, end) {
        var loadSequence = new Nt.Seq();
        loadSequence.read(seq);
        var r_sequence = loadSequence.complement().sequence();

        var s_adjust;

        if (start < 1 || startCoordinate === 1) {
            start = 1;
            s_adjust = 1;
        } else {
            s_adjust = start + 1;
        }

        var r_id = sequenceIdentifier + ' Location=' + chr + '..' + s_adjust + '-' + end + ' ReverseComplemented=true';
        return [r_sequence,r_id];
    }

    /* - - - - - - - - - - - - - - - - - - - - - - */
    /* Display function for the sequence - - - - - */
    /* - - - - - - - - - - - - - - - - - - - - - - */
    function displaySequence(BioJsObj, seq, id, loc, uid, charsPerLine) {

        // repopulate BioJS sequence object and display
        $('.wait_region2').empty();

        if (loc === '#identifier_results') {
            fullSequenceIdentifier = id + ' FlankLength=' + flankLength;
        } else {
            fullSequenceIdentifier = id + ' FlankLength=0';
            flankLength=0;
        }

        BioJsObj = new Sequence($,seq,sequenceIdentifier);
        BioJsObj.render(loc, {
        'showLineNumbers': true,
        'wrapAminoAcids': true,
        'charsPerLine': charsPerLine,
        'toolbar': false,
        'search': true,
        'id': uid,
        'location': chromloc,
        'flank': flankLength,
        'revComp': revSeq
        });

        var seqlen = parseInt(endCoordinate) - parseInt(startCoordinate);
        if ( flankLength > 0 && loc === '#identifier_results') {
            var fstart_b = 0;
            var fend_b = parseInt(flankLength);
            var fstart_e = parseInt(seqlen) - parseInt(flankLength);
            var fend_e = seqlen;
            var seqstart = parseInt(fend_b);
            var seqend = fstart_e;
            var flankCoverage = [
                {start: fstart_b, end: fend_b, color: '#33CCCC', underscore: false},
                {start: seqstart, end: seqend, color: 'black', underscore: false},
                {start: fstart_e, end: fend_e, color: '#33CCCC', underscore: false}
            ];

            //Define Legend and color codes
            var flankLegend = [
                {name: 'Target Sequence', color: 'black', underscore: false},
                {name: 'Flanking sequence', color: '#33CCCC', underscore: false}
            ];

            BioJsObj.coverage(flankCoverage);
            BioJsObj.addLegend(flankLegend);
        }

        curr_id = fullSequenceIdentifier;
        curr_seq = seq;
        return BioJsObj;
    }

    var saveAsFile = function saveAsFile(content, filetype, filename) {
        try {
            var isFileSaverSupported = !!new Blob();
            if (!isFileSaverSupported) {
                $('.error', appContext).html(errorMessage('Sorry, your browser does not support this feature. Please upgrade to a more modern browser.'));
            }
            var blob = new Blob([content], {type: filetype});
            window.saveAs(blob, filename);
        } catch (e) {
            $('.error', appContext).html(errorMessage('Sorry, your browser does not support this feature. Please upgrade to a more modern browser.'));
        }
    };

    var redrawSequence = function redrawSequence(revSeq, lowercase, lineLength, seqObj, location, uid) {
        var lowerCaseSeq = '';

        var s_adjust;
        if (startCoordinate < 1) {
            s_adjust = 1;
        } else {
            s_adjust = startCoordinate + 1;
        }

        if ( revSeq === true ) {
            var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
            if ( lowerCase === true ) {
                lowerCaseSeq = reversedArray[0].toLowerCase();
                seqObj = displaySequence(seqObj, lowerCaseSeq, reversedArray[1], location, uid, lineLength);
            } else {
                seqObj = displaySequence(seqObj, reversedArray[0], reversedArray[1], location, uid, lineLength);
            }
        } else {
            fullSequenceIdentifier =  sequenceIdentifier + ' Location=' + chromosomeId + '..' + s_adjust + '-' + endCoordinate + ' ReverseComplemented=false';
            if ( lowerCase === true ) {
                lowerCaseSeq = orig_sequence.toLowerCase();
                seqObj = displaySequence(seqObj, lowerCaseSeq, fullSequenceIdentifier, location, uid, lineLength);
            }else {
                seqObj = displaySequence(seqObj, orig_sequence, fullSequenceIdentifier, location, uid, lineLength);
            }
        }
    };

    var enableIdentSequenceDisplayButtons = function enableIdentSequenceDisplayButtons() {
        $('#revComp').prop('disabled', false);
        $('#revCompButton').prop('disabled', false);
        $('#lowerCase').prop('disabled', false);
        $('#lowerCaseButton').prop('disabled', false);
        $('#seqLineLengthI').prop('disabled', false);
        $('#download_sequence').prop('disabled', false);
    };

    var enableLocSequenceDisplayButtons = function enableLocSequenceDisplayButtons() {
        $('#revComp2').prop('disabled', false);
        $('#revCompButton').prop('disabled', false);
        $('#lowerCase2').prop('disabled', false);
        $('#lowerCaseButton').prop('disabled', false);
        $('#seqLineLengthL').prop('disabled', false);
        $('#download_sequence2').prop('disabled', false);
    };

    var disableIdentSequenceDisplayButtons = function disableIdentSequenceDisplayButtons() {
        $('#revComp').prop('disabled', true);
        $('#revCompButton').prop('disabled', true);
        $('#lowerCase').prop('disabled', true);
        $('#lowerCaseButton').prop('disabled', true);
        $('#seqLineLengthI').prop('disabled', true);
        $('#download_sequence').prop('disabled', true);
    };

    var disableLocSequenceDisplayButtons = function disableLocSequenceDisplayButtons() {
        $('#revComp2').prop('disabled', true);
        $('#revCompButton').prop('disabled', true);
        $('#lowerCase2').prop('disabled', true);
        $('#lowerCaseButton').prop('disabled', true);
        $('#seqLineLengthL').prop('disabled', true);
        $('#download_sequence2').prop('disabled', true);
    };

    /* - - - -Done with- -- - - -  */
    /* - - - the functions! - - -  */

    /* - - - - -  */
    /* Start here */
    /* - - - - -  */
    init();

    // define example data upon first launch of the app and reset
    var example_id = 'AT1G01210';
    var example_id2 = 'Sequence';
    var example_sequence = 'AGAATGTTGAAGAAACAGAAACTTAGGGTTTATGTGGTGGATGAATGATTTAGCAGCGAATTGAAGGGTGTGGTGGAAGATGGAGTTTTGTCCAACATGTGGGAATCTGTTGCGATACGAGGGAGGTGGCAATTCGAGATTCTTCTGTTCCACATGTCCATACGTCGCCTACATCCAAAGACAGGTTCTTTTTTCAATTATATACCTTTTGAAAGTTTGTGAGCAAACCGTTAAAATTCTCTCCTCTGTTCCTGAGTGCTTTGGAATTTTGACAGGTGGAGATAAAGAAGAAGCAACTTCTGGTTAAGAAATCTATAGAAGCTGTTGTGACTAAAGATGATATACCCACAGCTGCTGAAACTGAAGGTATTTTCAGTCTCTTGTCTTCTCTTCTTCTAATTTTAGGACTGTGATGAGTTGGTTCAGAGTTGATCTCACTTGGGGAAAGAGTAGAGTAGACTTTTGTTTCACTTTCTTTCTCATGTTGGGATTGTTTGGTTTTAACAGCCCCATGTCCAAGGTGTGGCCACGACAAGGCATACTTCAAATCAATGCAGATTCGTTCAGCAGATGAGCCAGAATCAAGATTTTATAGATGCTTGAAGTGCGAGTTCACTTGGCGTGAGGAATGAACTGACTGATGATCATCTTCTCCGTCTCTTTGCCTCTGCCAATTTTGAAAGTTTCTACTTTTGCAACCTTCTTAGAGTTTGTTTTACCATTGCAAATTTAGCAGATCCTTTATGTACTCTGCTTCTTTCTGTCTCACAGCTCAATAGTTTCTGTTTCGATTAAATTTTGGAATGTTGTGCAAAGTTTTAATCTTTGAGGTGAAAGAGATGAAGCAA';

    // insert initial example data into global variables
    orig_sequence = example_sequence;
    curr_seq = example_sequence;
    chromosomeId = 'Chr1';
    startCoordinate = 88897;
    endCoordinate = 89745;
    chromloc = 'Chr1..' + (startCoordinate+1) + '-' + endCoordinate;
    sequenceIdentifier = example_id;
    fullSequenceIdentifier = example_id + ' Location=Chr1..88898-89745 ReverseComplemented=False FlankLength=0';

    //identifiers to make the html ids of Sequence-Viewer Configuration unique
    var IUID = 'I001';
    var LUID = 'L001';

    // Initialize a BioJs sequence for Search By Identifier tab
    var mySequenceI = new Sequence($,example_sequence,example_id);
    mySequenceI.render('#identifier_results', {
        'showLineNumbers': true,
        'wrapAminoAcids': true,
        'charsPerLine': $('#seqLineLengthI').val(),
        'toolbar': false,
        'search': true,
        'id': IUID,
        'location': chromloc,
        'flank': 0,
        'revComp': false
    });

    // Initialize a BioJs sequence for Search By Genome Location tab
    var mySequenceL = new Sequence($,example_sequence,example_id2);
    mySequenceL.render('#location_results', {
        'showLineNumbers': true,
        'wrapAminoAcids': true,
        'charsPerLine': $('#seqLineLengthL').val(),
        'toolbar': false,
        'search': true,
        'id': LUID,
        'location': chromloc,
        'flank': 0,
        'revComp': false
    });

    enableIdentSequenceDisplayButtons();
    enableLocSequenceDisplayButtons();

    // Setup clear button functions
    $('#identifier_search_form_reset').on('click', function() {
        $('.error').empty();
        $('.wait_region').empty();
        $('#identifier_results').empty();
        $('#geneIdentifier').val('AT1G01210');
        $('#flankLen').val('0');
        $('#revComp').prop('checked', false);
        $('#lowerCase').prop('checked', false);
        $('#seqLineLengthI').val('60');

        // reset to initial example
        sequenceIdentifier = example_id;
        fullSequenceIdentifier = example_id + ' Location=Chr1..88898-89745 ReverseComplemented=False FlankLength=0';
        curr_seq = example_sequence;
        orig_sequence = example_sequence;
        chromosomeId = 'Chr1';
        startCoordinate = 88897;
        endCoordinate = 89745;
        chromloc = 'Chr1..' + (startCoordinate+1) + '-' + endCoordinate;
        flankLength = 0;

        mySequenceI = new Sequence($,example_sequence,example_id);
        mySequenceI.render('#identifier_results', {
            'showLineNumbers': true,
            'wrapAminoAcids': true,
            'charsPerLine': $('#seqLineLengthI').val(),
            'toolbar': false,
            'search': true,
            'id': IUID,
            'location': chromloc,
            'flank': flankLength,
            'revComp': false
        });
        enableIdentSequenceDisplayButtons();
    });

    $('#location_search_form_reset').on('click', function() {
        $('.error').empty();
        $('.wait_region2').empty();
        $('#location_results').empty();
        $('#chromosomeId').val('Chr1');
        $('#startCoordinate').val('1');
        $('#endCoordinate').val('1000');
        $('#revComp2').prop('checked', false);
        $('#lowerCase2').prop('checked', false);
        $('#seqLineLengthL').val('60');

        sequenceIdentifier = example_id2;
        fullSequenceIdentifier = example_id2 + ' Location=Chr1..88898-89745 ReverseComplemented=False FlankLength=0';
        curr_seq = example_sequence;
        orig_sequence = example_sequence;
        chromosomeId = 'Chr1';
        startCoordinate = 88897;
        endCoordinate = 89745;
        chromloc = 'Chr1..' + (startCoordinate+1) + '-' + endCoordinate;

        mySequenceL = new Sequence($,example_sequence,example_id2);
        mySequenceL.render('#location_results', {
            'showLineNumbers': true,
            'wrapAminoAcids': true,
            'charsPerLine': $('#seqLineLengthL').val(),
            'toolbar': false,
            'search': true,
            'id': LUID,
            'location': chromloc,
            'flank': 0,
            'revComp': false
        });
        enableLocSequenceDisplayButtons();
    });

    $('#gene_search_form_reset').on('click', function (e) {
        e.preventDefault();
        $('.error').empty();
        $('.wait_region3').empty();
        $('#gene_list_results').empty();
        $('#gene_chromosomeId').val('Chr1');
        $('#geneStartCoordinate').val('29733');
        $('#geneEndCoordinate').val('37349');
    });

    // Setup submit button functions which call the main wrapper function
    $('form[name=identifier_search_form]',appContext).on('submit',function(e) {
        log( 'Searching by identifier...' );

        // uncheck checkboxes
        $('#revComp').prop('checked', false);
        $('#lowerCase').prop('checked', false);
        $('#seqLineLengthI').val('60');

        e.preventDefault();

        $('.wait_region', appContext).html('<div class="progress progress-striped active">' +
                                           '<div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;">' +
                                           '<span class="sr-only">Loading Data...</span></div></div>');

        document.getElementById('wait_region').style.display='block';

        // Assign input parameters to global variables
        geneIdentifier = this.geneIdentifier.value;
        sequenceIdentifier = geneIdentifier;
        flankLength = this.flankLen.value;

        // clear current display/errors
        $('#identifier_results').empty();
        $('.error').empty();

        // setup query parameters
        var params = {
            identifier: geneIdentifier,
            flank: flankLength
        };

        disableIdentSequenceDisplayButtons();

        // Run the query
        Agave.api.adama.search({
            'namespace': 'aip',
            'service': 'get_sequence_by_identifier_v0.3',
            'queryParams': params
        }, wrapperSequenceByIdentifier, showError);
    });

    $('form[name=location_search_form]',appContext).on('submit',function(e) {
        log( 'Searching by coordinate...' );

        // uncheck checkboxes
        $('#revComp2').prop('checked', false);
        $('#lowerCase2').prop('checked', false);
        $('#seqLineLengthL').val('60');

        e.preventDefault();

        $('.wait_region2', appContext).html('<div class="progress progress-striped active">' +
                                           '<div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;">' +
                                           '<span class="sr-only">Loading Data...</span></div></div>');

        // Assign input parameters to global variables
        chromosomeId = this.chromosomeId.value;
        startCoordinate = this.startCoordinate.value;
        endCoordinate = this.endCoordinate.value;
        sequenceIdentifier = 'Sequence';

        // clear current display/errors
        $('#location_results').empty();
        $('.error').empty();

        // setup query parameters
        var params = {
            chromosome: chromosomeId,
            start: startCoordinate,
            end: endCoordinate,
            flank: 0
        };

        var seqLen = endCoordinate - startCoordinate;

        if ( seqLen >= 100000) {
            $('.error', appContext).html(warningMessage('This could take a while! Thank you for your patience.'));
        }

        if ( seqLen < 999999) {
            // wrapper function to run the whole sequence retrieval and display
            // Run the query
            disableLocSequenceDisplayButtons();
            Agave.api.adama.search({
                'namespace': 'aip',
                'service': 'get_sequence_by_coordinate_v0.3',
                'queryParams': params
            }, wrapperSequenceByLocation, showError2);
        } else {
            disableLocSequenceDisplayButtons();
            $('.wait_region2').empty();
            // Do not execute
            $('.error', appContext).html(errorMessage('The requested sequence size exceeds the maximum!'));
        }
    });

    $('form[name=gene_search_form]', appContext).on('submit', function (e) {
        console.log('Search genes by location...');
        e.preventDefault();

        $('.wait_region3', appContext).html('<div class="progress progress-striped active">' +
                                           '<div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;">' +
                                           '<span class="sr-only">Loading Data...</span></div></div>');

        // clear current display/errors
        $('.gene_list_results', appContext).empty();
        $('.error').empty();

        // setup query parameters
        var params = {
            chromosome: this.gene_chromosomeId.value,
            start: this.geneStartCoordinate.value,
            end: this.geneEndCoordinate.value,
        };

        // Run the query
        Agave.api.adama.search({
            'namespace': 'aip',
            'service': 'get_identifiers_by_coordinate_v0.1',
            'queryParams': params
        }, showGeneResults, showError3);
    });

    // if the chars per line is changed
    $('#seqLineLengthI').on('change', function () {
        revSeq = $('#revComp').is(':checked');
        lowerCase = $('#lowerCase').is(':checked');
        var lineLength = $('#seqLineLengthI').val();

        redrawSequence(revSeq, lowerCase, lineLength, mySequenceI, '#identifier_results', IUID);
    });

    // If the reverse complement button is checked
    $('#revComp').on('click', function() {
        revSeq = $('#revComp').is(':checked');
        lowerCase = $('#lowerCase').is(':checked');
        var lineLength = $('#seqLineLengthI').val();

        redrawSequence(revSeq, lowerCase, lineLength, mySequenceI, '#identifier_results', IUID);
    });

    $('#download_sequence').on('click', function() {
        var content = '>' + fullSequenceIdentifier + '\n' + curr_seq;
        saveAsFile(content, 'text/plain;charset=utf-8', 'sequence.txt');
    });


    // If the reverse complement button is checked
    $('#lowerCase').on('click', function() {
        lowerCase = $('#lowerCase').is(':checked');
        revSeq = $('#revComp').is(':checked');
        var lineLength = $('#seqLineLengthI').val();

        redrawSequence(revSeq, lowerCase, lineLength, mySequenceI, '#identifier_results', IUID);
    });

    // if the chars per line is changed
    $('#seqLineLengthL').on('change', function () {
        revSeq = $('#revComp2').is(':checked');
        lowerCase = $('#lowerCase2').is(':checked');
        var lineLength = $('#seqLineLengthL').val();

        redrawSequence(revSeq, lowerCase, lineLength, mySequenceL, '#location_results', LUID);
    });

    // If the reverse complement button is checked
    $('#revComp2').on('click', function() {
        revSeq = $('#revComp2').is(':checked');
        lowerCase = $('#lowerCase2').is(':checked');
        var lineLength = $('#seqLineLengthL').val();

        redrawSequence(revSeq, lowerCase, lineLength, mySequenceL, '#location_results', LUID);
    });

    $('#download_sequence2').on('click', function() {
        var content = '>' + fullSequenceIdentifier + '\n' + curr_seq;
        saveAsFile(content, 'text/plain;charset=utf-8', 'sequence.txt');
    });


    // If the reverse complement button is checked
    $('#lowerCase2').on('click', function() {
        lowerCase = $('#lowerCase2').is(':checked');
        revSeq = $('#revComp2').is(':checked');
        var lineLength = $('#seqLineLengthL').val();

        redrawSequence(revSeq, lowerCase, lineLength, mySequenceL, '#location_results', LUID);
    });

    /* - - - */
    /* Done! */
    /* - - - */
    });

})(window, jQuery, _);
