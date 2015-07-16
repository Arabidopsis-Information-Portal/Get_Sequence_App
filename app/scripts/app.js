(function(window, $, undefined) {
    'use strict';
    
    console.log('Welcome to the GetSequence App!');
    
    var appContext = $('[data-app-name="getSequence-app"]');
    
    window.addEventListener('Agave::ready', function() {
	
	var Agave = window.Agave;		
	var geneIdentifier = '';
	var revComp = '';
	var flankLength;
	var revSeq;
	var j_sequence;
	var new_id;
	
	var DEBUG = true;
	var log = function log( message ) {
            if ( DEBUG ) {
		console.log( message );
            }
	};

	// Start notification
	var init = function init() {
            log( 'Initializing app...' );
	};	

	// Error notification
	var showError = function(err) {
            $('.error', appContext).html('<div class="alert alert-danger">' + err.obj.message + '</div>');
            console.error('Status: ' + err.obj.status + '  Message: ' + err.obj.message);
	};

	
	// Displayer function for the identifier search
	var showIdentifierResults = function showIdentifierResults( json ) {

	    // Verify the API query was successful
	    if ( ! (json && json.obj) || json.obj.status !== 'success') {
		$('.identifier_results', appContext).html('<div class="alert alert-danger">Error with sequence retrieval!</div>');
		return;
            }

	    // Begin parsing json
	    var data = json.obj || json;

	    // Extract the sequence
	    j_sequence = data.result[0].sequence;
	    var j_start = data.result[0].start;
	    var j_end = data.result[0].end;
	    var j_chromosome = data.result[0].chromosome;
	    new_id = geneIdentifier + ' ' + 'Location=' + j_chromosome + '..' + j_start + '-' + j_end + ' Flank=' + flankLength + 'bp' + ' ReverseComplemented=False';

	    //Option for reverse complementing
	    if ( revSeq === true ) {
		var loadSequence = new Nt.Seq();
		loadSequence.read(j_sequence);
		j_sequence = loadSequence.complement().sequence();
		new_id = geneIdentifier + ' ' + 'Location=' + j_chromosome + '..' + j_start + '-' + j_end + ' Flank=' + flankLength + 'bp' + ' ReverseComplemented=True';
	    }
	    
	    // Initialize a BioJS sequence object
	    var mySequence = new Sequence({
		sequence : j_sequence,
		target : 'identifier_results',
		format : 'FASTA',
		numCols: 100,
		id : new_id,
	    });
	    
	    // Hides the format selector.
	    //mySequence.hideFormatSelector();
	};

	// Displayer function for the location search
	var showLocationResults = function showIdentifierResults( json ) {
	    
	    // Verify the API query was successful
	    if ( ! (json && json.obj) || json.obj.status !== 'success') {
		$('.location_results', appContext).html('<div class="alert alert-danger">Error with sequence retrieval!</div>');
		return;
            }

	    // Begin parsing json
	    var data = json.obj || json;

	    // Extract the sequence
	    j_sequence = data.result[0].sequence;	    
	    var j_start = data.result[0].start;
	    var j_end = data.result[0].end;
	    var j_chromosome = data.result[0].chromosome;
	    new_id = geneIdentifier + ' ' + 'Location=' + j_chromosome + '..' + j_start + '-' + j_end + ' Flank=' + flankLength + 'bp' + ' ReverseComplemented=False';
	    
	    //Option for reverse complementing
	    if ( revSeq === true ) {
		var loadSequence = new Nt.Seq();
		loadSequence.read(j_sequence);
		j_sequence = loadSequence.complement().sequence();
		new_id = geneIdentifier + ' ' + 'Location=' + j_chromosome + '..' + j_start + '-' + j_end + ' Flank=' + flankLength + 'bp' + ' ReverseComplemented=True';
	    }
	    
	    // Initialize a BioJS sequence object
	    var mySequence = new Sequence({
		sequence : j_sequence,
		target : 'location_results',
		format : 'FASTA',
		numCols: 100,
		id : new_id,
	    });
	    
	    // Hides the format selector.
	    //mySequence.hideFormatSelector();

	};
	
	/* Start here */
	init();

	// Setup clear button functions
	$('#identifier_search_form_reset').on('click', function() {
            $('.error').empty();
            $('.identifier_results').empty();
            $('#geneIdentifier').val('AT1G33930');
            $('#flankLen').val('0');
	    $("#revComp").prop("checked", false);
	});
	
	$('#location_search_form_reset').on('click', function() {
            $('.error').empty();
            $('.location_results').empty();
            $('#chromosomeId').val('Chr1');
            $('#startCoordinate').val('0');
	    $('#endCoordinate').val('0');
            $('#flankLen2').val('0');
	    $("#revComp2").prop("checked", false);
	});


	
	$('#download_sequence').on('click', function(e) {
	    e.preventDefault();
	    var content = '>' + new_id + '\n' + j_sequence;
	    var dl = document.createElement('a');
	    dl.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
	    dl.setAttribute('download', 'sequence.txt');

	    // Set hidden so the element doesn't disrupt your page
	    dl.setAttribute('visibility', 'hidden');
	    dl.setAttribute('display', 'none');

	    // Append to page
	    document.body.appendChild(dl);

	    // Now you can trigger the click
	    dl.click();
	});

	$('#download_sequence2').on('click', function(e) {
	    e.preventDefault();
	    var content = '>' + new_id + '\n' + j_sequence;
	    var dl = document.createElement('a');
	    dl.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
	    dl.setAttribute('download', 'sequence.txt');
	    
	    // Set hidden so the element doesn't disrupt your page
	    dl.setAttribute('visibility', 'hidden');
	    dl.setAttribute('display', 'none');

	    // Append to page
	    document.body.appendChild(dl);

	    // Now you can trigger the click
	    dl.click();
		});
	
	// Setup submit button functions

	$('form[name=identifier_search_form]',appContext).on('submit',function(e){

            log( 'Searching by identifier...' );
	    
            e.preventDefault();

	    geneIdentifier = this.geneIdentifier.value;
	    flankLength = this.flankLen.value;
	    revSeq = $("#revComp").is(":checked");

	    log( 'Search parameters: ' +  geneIdentifier + ',' + flankLength + ',' + revSeq);
	    
	    // setup query parameters
            var params = {
		identifier: geneIdentifier,
		flank: flankLength
            };
	    
            $('.identifier_results').empty();
            $('.error').empty();

	    // Run the query
            Agave.api.adama.search({
		'namespace': 'aip',
		'service': 'get_sequence_by_identifier_v0.2',
		'queryParams': params
            }, showIdentifierResults, showError);
	});

	$('form[name=location_search_form]',appContext).on('submit',function(e){

	    log( 'Searching by coordinate...' );
	    
            e.preventDefault();

	    flankLength = this.flankLen2.value;
	    revSeq = $("#revComp2").is(":checked");
	    
	    log( 'Search parameters: ' + this.chromosomeId.value + ',' + this.startCoordinate.value + ',' + this.endCoordinate.value + ',' + flankLength + ',' + revSeq );
	    
	    // setup query parameters
            var params = {
		chromosome: this.chromosomeId.value,
		start: this.startCoordinate.value,
		end: this.endCoordinate.value,
		flank: flankLength
            };
	    
            $('.identifier_results').empty();
            $('.error').empty();

	    // Run the query
            Agave.api.adama.search({
		'namespace': 'aip',
		'service': 'get_sequence_by_coordinate_v0.2',
		'queryParams': params
            }, showLocationResults, showError);
	}); 
	
    });
    
})(window, jQuery);
