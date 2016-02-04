/* global Sequence, Nt, Clipboard, _ */
/* jshint camelcase: false */
(function(window, $, _, undefined) {
    'use strict';

    console.log('Welcome to the GetSequence App!');

    var appContext = $('[data-app-name="getSequence-app"]');

    window.addEventListener('Agave::ready', function() {

    // Initialize some variables
    var Agave = window.Agave;
    var identifier_sequence;
    var location_sequence;
    var thalemine_user = {};
    var gTable;
    var mySequenceI;
    var mySequenceL;

    //identifiers to make the html ids of Sequence-Viewer Configuration unique
    var IUID = 'I001';
    var LUID = 'L001';

    function Seq(sequence, chromosome, start, end) {
        this.sequence = sequence;
        this.chromosome = chromosome;
        this.start_coordinate = start;
        this.end_coordinate = end;
        this.identifier = 'Sequence';
        this.flank_length = '';
        this.reverseComplemented = false;
        this.lowerCased = false;
    }

    Seq.prototype = {
        constructor: Seq,
        startAdjusted:function () {
            if (this.start_coordinate < 1 || this.start_coordinate === 1) {
                return 1;
            } else {
                return this.start_coordinate + 1;
            }
        },
        chromosomeLocation:function () {
            return this.chromosome + '..' + this.startAdjusted() + '-' + this.end_coordinate;
        },
        definitionLine:function () {
            var defline = this.identifier + ' Location=' + this.chromosomeLocation();
            if (this.reverseComplemented) {
                defline += ' ReverseComplemented=' + this.reverseComplemented;
            }
            if (this.flank_length && this.flank_length !== '') {
                defline += ' FlankLength=' + this.flank_length;
            }
            return defline;
        },
        reverseComplement:function () {
            this.reverseComplemented = true;
            var loadSequence = new Nt.Seq();
            loadSequence.read(this.sequence);
            return loadSequence.complement().sequence();
        },
        lowerCase:function () {
            return this.sequence.toLowerCase();
        },
        draw:function () {
            var draw_seq = this.sequence;
            if (this.reverseComplemented) {
                if (this.lowerCased) {
                    draw_seq = this.reverseComplement().toLowerCase();
                } else {
                    draw_seq = this.reverseComplement();
                }
            } else {
                if (this.lowerCased) {
                    draw_seq = this.lowerCase();
                }
            }
            return draw_seq;
        }
    };

    var DEBUG = true;
    var log = function log( message ) {
        if ( DEBUG ) {
            console.log( message );
        }
    };

    // Start notification
    var init = function init() {
        log( 'Initializing sequence app...' );
        new Clipboard('.btn-clipboard');
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

    var showError = function showError(err) {
        $('#wait_region').addClass('hidden');
        var message = '';
        var status = '';
        if (err && err.obj) {
            message = err.obj.message;
            status = err.obj.status;
        }
        $('.error', appContext).html(errorMessage('Error interacting with the server [' + message + ']! Please try again later.'));
        console.error('Status: ' + status + '  Message: ' + message);
    };

    /* - - - - - - - - - - - - - - - - - - - - - - -*/
    /* Process function for the sequence search - - */
    /* - - - - - - - - - - - - - - - - - - - - - - -*/
    var processSequenceResults = function processSequenceResults( json ) {

        // Begin parsing json
        var data = json.obj || json;

        // Extract the sequence
        var sequence = data.result[0].sequence;
        var start = data.result[0].start;

        var end = data.result[0].end;
        var chromosome = data.result[0].chromosome;

        // return sequences and ids
        var my_seq = new Seq(sequence.toUpperCase(), chromosome, start, end);

        return my_seq;
    };

    /* - - - - - - - - - - - - - - - - - - - - - - */
    /* Display function for the sequence - - - - - */
    /* - - - - - - - - - - - - - - - - - - - - - - */
    function displaySequence(BioJsObj, seq_obj, loc, uid, charsPerLine) {

        BioJsObj = new Sequence($,seq_obj.sequence,seq_obj.identifier);
        BioJsObj.render(loc, {
        'showLineNumbers': true,
        'wrapAminoAcids': true,
        'charsPerLine': charsPerLine,
        'toolbar': false,
        'search': true,
        'id': uid,
        'location': seq_obj.chromosomeLocation(),
        'flank': seq_obj.flank_length,
        'revComp': seq_obj.reverseComplemented
        });

        var seqlen = parseInt(seq_obj.end_coordinate) - parseInt(seq_obj.start_coordinate);
        if ( seq_obj.flank_length > 0 && loc === '#identifier_results') {
            var fstart_b = 0;
            var fend_b = parseInt(seq_obj.flank_length);
            var fstart_e = parseInt(seqlen) - parseInt(seq_obj.flank_length);
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

    var formatSequence = function formatSequence(sequence, ident, length) {
        var regex = new RegExp('(.{' + length + '})', 'g');
        var displaySeq = sequence.replace(regex, '$1\n');
        var content = '>' + ident + '\n' + displaySeq;
        return content;
    };

    var enableIdentSequenceDisplayButtons = function enableIdentSequenceDisplayButtons() {
        $('#revComp').prop('disabled', false);
        $('#revCompButton').prop('disabled', false);
        $('#lowerCase').prop('disabled', false);
        $('#lowerCaseButton').prop('disabled', false);
        $('#fasta').prop('disabled', false);
        $('#fastaButton').prop('disabled', false);
        $('#seqLineLengthI').prop('disabled', false);
        $('#download_sequence').prop('disabled', false);
    };

    var enableLocSequenceDisplayButtons = function enableLocSequenceDisplayButtons() {
        $('#revComp2').prop('disabled', false);
        $('#revCompButton').prop('disabled', false);
        $('#lowerCase2').prop('disabled', false);
        $('#lowerCaseButton').prop('disabled', false);
        $('#fasta2').prop('disabled', false);
        $('#fastaButton').prop('disabled', false);
        $('#seqLineLengthL').prop('disabled', false);
        $('#download_sequence2').prop('disabled', false);
    };

    var disableIdentSequenceDisplayButtons = function disableIdentSequenceDisplayButtons() {
        $('#revComp').prop('disabled', true);
        $('#revCompButton').prop('disabled', true);
        $('#lowerCase').prop('disabled', true);
        $('#lowerCaseButton').prop('disabled', true);
        $('#fasta').prop('disabled', true);
        $('#fastaButton').prop('disabled', true);
        $('#seqLineLengthI').prop('disabled', true);
        $('#download_sequence').prop('disabled', true);
    };

    var disableLocSequenceDisplayButtons = function disableLocSequenceDisplayButtons() {
        $('#revComp2').prop('disabled', true);
        $('#revCompButton').prop('disabled', true);
        $('#lowerCase2').prop('disabled', true);
        $('#lowerCaseButton').prop('disabled', true);
        $('#fasta2').prop('disabled', true);
        $('#fastaButton').prop('disabled', true);
        $('#seqLineLengthL').prop('disabled', true);
        $('#download_sequence2').prop('disabled', true);
    };

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /* Wrapper function for retrieving and displaying of the sequence by identifier */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    var wrapperSequenceByIdentifier = function wrapperSequenceByIdentifier(json) {
        // Verify the API query was successful
        if ( ! (json && json.obj) || json.obj.status !== 'success') {
            $('.error', appContext).html(errorMessage('Error with sequence retrieval!'));
            return;
        }

        identifier_sequence = processSequenceResults(json);
        identifier_sequence.identifier = $('#geneIdentifier').val();
        identifier_sequence.flank_length = $('#flankLen').val();
        // The search is done, hide the waiting bar
        $('#wait_region').addClass('hidden');
        $('.error').empty();
        $('#identifier_display').removeClass('hidden');
        enableIdentSequenceDisplayButtons();

        // Display the sequence
        var lineLength = $('#seqLineLengthI').val();
        mySequenceI = displaySequence(mySequenceI, identifier_sequence, '#identifier_results', IUID, lineLength);
    };


    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /* Wrapper function for retrieving and displaying of the sequence by location   */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    var wrapperSequenceByLocation = function wrapperSequenceByLocation(json) {
        // Verify the API query was successful
        if ( ! (json && json.obj) || json.obj.status !== 'success') {
            $('.error', appContext).html(errorMessage('Error with sequence retrieval!'));
            return;
        }

        location_sequence = processSequenceResults(json);
        // The search is done, hide the waiting bar
        $('#wait_region').addClass('hidden');
        $('.error').empty();
        $('#location_display').removeClass('hidden');
        enableLocSequenceDisplayButtons();

        // Display the sequence
        var lineLength = $('#seqLineLengthL').val();
        mySequenceL = displaySequence(mySequenceL, location_sequence, '#location_results', LUID, lineLength);
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
        $('#wait_region').addClass('hidden');
        $('.error').empty();

        $('.gene_list_results', appContext).html(templates.geneTable(json.obj));

        geneReportHandler();

        gTable = $('.gene_list_results table', appContext).DataTable( {'lengthMenu': [10, 25, 50, 100],
                                                                       'columnDefs': [{'targets': 5,
                                                                       'searchable': false,
                                                                       'orderable': false,
                                                                       'width': '40px'}]} );

        if (gTable.data().length > 0) {
            $('div.gene_list_results', appContext).prepend('<button type="button" class="btn btn-default export-button" id="export_list">Export as List to ThaleMine</button>');
        }

        Agave.api.adama.getAccess(
            {'namespace': 'aip', 'service': 'get_thalemine_user_v1.1'},
            function (search) {
                thalemine_user = search.obj.user;
            }
        );

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

    /* - - - - -  */
    /* Start here */
    /* - - - - -  */
    init();

    // Setup clear button functions
    $('#identifier_search_form_reset').on('click', function() {
        $('.error').empty();
        $('#wait_region').addClass('hidden');
        $('#identifier_results').empty();
        $('#identifier_results_fasta').empty();
        $('#geneIdentifier').val('AT1G01210');
        $('#flankLen').val('0');
        $('#revComp').prop('checked', false);
        $('#lowerCase').prop('checked', false);
        $('#seqLineLengthI').val('60');
        $('#identifier_display').addClass('hidden');
    });

    $('#location_search_form_reset').on('click', function() {
        $('.error').empty();
        $('#wait_region').addClass('hidden');
        $('#location_results').empty();
        $('#location_results_fasta').empty();
        $('#chromosomeId').val('Chr1');
        $('#startCoordinate').val('1');
        $('#endCoordinate').val('1000');
        $('#revComp2').prop('checked', false);
        $('#lowerCase2').prop('checked', false);
        $('#seqLineLengthL').val('60');
        $('#location_display').addClass('hidden');
    });

    $('#gene_search_form_reset').on('click', function (e) {
        e.preventDefault();
        $('.error').empty();
        $('#wait_region').addClass('hidden');
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

        $('#wait_region').removeClass('hidden');

        // Assign input parameters to global variables
        var geneIdentifier = this.geneIdentifier.value;
        //var sequenceIdentifier = geneIdentifier;
        var flankLength = this.flankLen.value;

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

        $('#wait_region').removeClass('hidden');

        // clear current display/errors
        $('#location_results').empty();
        $('.error').empty();

        // setup query parameters
        var params = {
            chromosome: this.chromosomeId.value,
            start: this.startCoordinate.value,
            end: this.endCoordinate.value,
            flank: 0
        };

        var seqLen = this.endCoordinate.value - this.startCoordinate.value;

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
            }, wrapperSequenceByLocation, showError);
        } else {
            disableLocSequenceDisplayButtons();
            // Do not execute
            $('.error', appContext).html(errorMessage('The requested sequence size exceeds the maximum!'));
        }
    });

    $('form[name=gene_search_form]', appContext).on('submit', function (e) {
        console.log('Search genes by location...');
        e.preventDefault();

        // clear current display/errors
        $('.gene_list_results', appContext).empty();
        $('.error').empty();
        $('#wait_region').removeClass('hidden');

        // setup query parameters
        var params = {
            chromosome: this.gene_chromosomeId.value,
            start: this.geneStartCoordinate.value,
            end: this.geneEndCoordinate.value,
        };

        // Run the query
        Agave.api.adama.search({
            'namespace': 'aip',
            'service': 'get_identifiers_by_coordinate_v0.2',
            'queryParams': params
        }, showGeneResults, showError);
    });

    var redrawIdentifierSequence = function redrawIdentifierSequence() {
        identifier_sequence.reverseComplemented = $('#revComp').is(':checked');
        identifier_sequence.lowerCased = $('#lowerCase').is(':checked');
        var lineLength = $('#seqLineLengthI').val();
        mySequenceI = displaySequence(mySequenceI, identifier_sequence, '#identifier_results', IUID, lineLength);
    };

    var redrawLocationSequence = function redrawLocationSequence() {
        location_sequence.reverseComplemented = $('#revComp2').is(':checked');
        location_sequence.lowerCased = $('#lowerCase2').is(':checked');
        var lineLength = $('#seqLineLengthL').val();
        mySequenceL = displaySequence(mySequenceL, location_sequence, '#location_results', LUID, lineLength);
    };

    // if the chars per line is changed
    $('#seqLineLengthI').on('change', function () {
        redrawIdentifierSequence();
    });

    // If the reverse complement button is checked
    $('#revComp').on('click', function() {
        redrawIdentifierSequence();
    });

    // If the lowercase button is checked
    $('#lowerCase').on('click', function() {
        redrawIdentifierSequence();
    });

    $('#download_sequence').on('click', function() {
        identifier_sequence.reverseComplemented = $('#revComp').is(':checked');
        identifier_sequence.lowerCased = $('#lowerCase').is(':checked');
        var lineLength = $('#seqLineLengthI').val();
        var content = formatSequence(identifier_sequence.draw(), identifier_sequence.definitionLine(), lineLength);
        saveAsFile(content, 'text/plain;charset=utf-8', 'sequence.txt');
    });

    $('#fasta').on('click', function() {
        if ($('#fasta').is(':checked')) {
            $('#identifier_results').addClass('hidden');
            $('#identifier_results_fasta').removeClass('hidden');
            identifier_sequence.reverseComplemented = $('#revComp').is(':checked');
            identifier_sequence.lowerCased = $('#lowerCase').is(':checked');
            var lineLength = $('#seqLineLengthI').val();
            var content = formatSequence(identifier_sequence.draw(), identifier_sequence.definitionLine(), lineLength);
            var display = '<br>' +
                          '<textarea id="ident_fasta_box" class="form-control fasta-box" rows="10" readonly>' +
                          content +
                          '</textarea>' +
                          '<br>' +
                          '<button class="btn-clipboard" data-clipboard-target="#ident_fasta_box">' +
                          '<i class="fa fa-clipboard"></i> Copy to Clipboard</button>';
            $('#identifier_results_fasta').html(display);

            // disable relevant buttons
            $('#revComp').prop('disabled', true);
            $('#revCompButton').prop('disabled', true);
            $('#lowerCase').prop('disabled', true);
            $('#lowerCaseButton').prop('disabled', true);
            $('#seqLineLengthI').prop('disabled', true);

        } else {
            $('#identifier_results').removeClass('hidden');
            $('#identifier_results_fasta').empty();
            $('#identifier_results_fasta').addClass('hidden');

            // enable all buttons
            $('#revComp').prop('disabled', false);
            $('#revCompButton').prop('disabled', false);
            $('#lowerCase').prop('disabled', false);
            $('#lowerCaseButton').prop('disabled', false);
            $('#seqLineLengthI').prop('disabled', false);
        }
    });

    // if the chars per line is changed
    $('#seqLineLengthL').on('change', function () {
        redrawLocationSequence();
    });

    // If the reverse complement button is checked
    $('#revComp2').on('click', function() {
        redrawLocationSequence();
    });

    // If the lowercase button is checked
    $('#lowerCase2').on('click', function() {
        redrawLocationSequence();
    });

    $('#download_sequence2').on('click', function() {
        location_sequence.reverseComplemented = $('#revComp2').is(':checked');
        location_sequence.lowerCased = $('#lowerCase2').is(':checked');
        var lineLength = $('#seqLineLengthL').val();
        var content = formatSequence(location_sequence.draw(), location_sequence.definitionLine(), lineLength);
        saveAsFile(content, 'text/plain;charset=utf-8', 'sequence.txt');
    });

    $('#fasta2').on('click', function() {
        if ($('#fasta2').is(':checked')) {
            $('#location_results').addClass('hidden');
            $('#location_results_fasta').removeClass('hidden');
            location_sequence.reverseComplemented = $('#revComp2').is(':checked');
            location_sequence.lowerCased = $('#lowerCase2').is(':checked');
            var lineLength = $('#seqLineLengthL').val();
            var content = formatSequence(location_sequence.draw(), location_sequence.definitionLine(), lineLength);
            var display = '<br>' +
                          '<textarea id="location_fasta_box" class="form-control fasta-box" rows="10" readonly>' +
                          content +
                          '</textarea>' +
                          '<br>' +
                          '<button class="btn-clipboard" data-clipboard-target="#location_fasta_box">' +
                          '<i class="fa fa-clipboard"></i> Copy to Clipboard</button>';
            $('#location_results_fasta').html(display);

            // disable relevant buttons
            $('#revComp2').prop('disabled', true);
            $('#revCompButton').prop('disabled', true);
            $('#lowerCase2').prop('disabled', true);
            $('#lowerCaseButton').prop('disabled', true);
            $('#seqLineLengthL').prop('disabled', true);

        } else {
            $('#location_results').removeClass('hidden');
            $('#location_results_fasta').empty();
            $('#location_results_fasta').addClass('hidden');

            // enable all buttons
            $('#revComp2').prop('disabled', false);
            $('#revCompButton').prop('disabled', false);
            $('#lowerCase2').prop('disabled', false);
            $('#lowerCaseButton').prop('disabled', false);
            $('#seqLineLengthL').prop('disabled', false);
        }
    });

    $('.gene_list_results', appContext).on('click', '#export_list', function (e) {
        e.preventDefault();
        var ids = [];
        gTable.column(0).data().each(function (value) {
            ids.push($($.parseHTML(value)).text());
        });

        var id_str = ids.join(' ');
        var list_name = 'Genes_on_' + $('#gene_chromosomeId').val() + '_between_' + $('#geneStartCoordinate').val() + '_and_' + $('#geneEndCoordinate').val() + '-' + new Date().toISOString();

        $.ajax({
            url: 'https://api.araport.org/community/v0.3/aip/create_thalemine_list_v1.1/access?name=' + list_name + '&type=Gene',
            contentType: 'text/plain',
            type: 'POST',
            processData: false,
            headers: {'Authorization': 'Bearer ' + Agave.token.accessToken},
            data: id_str,
            error: function (err) {
                var msg = 'Error creating list ' + list_name + ' for user ' +  getUserName() + ' in ThaleMine. Please try again later!';
                $('.error', appContext).html(errorMessage(msg));
                console.error(msg + ': ' + err);
            },
            success: function (data) {
                if ( ! (data) || ! data.wasSuccessful) {
                    var msg = 'Error creating list ' + list_name + ' for user ' +  getUserName() + ' in ThaleMine. Please try again later!';
                    $('.error', appContext).html(errorMessage(msg));
                    console.error(msg);
                    return;
                }
                $('.error', appContext).html(infoMessage('List ' + list_name + ' created for user ' + getUserName() + ' in ThaleMine!'));
            }
        });
    });

    /* - - - */
    /* Done! */
    /* - - - */
    });

})(window, jQuery, _);
