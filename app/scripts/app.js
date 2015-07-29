(function(window, $, undefined) {
    'use strict';
    
    console.log('Welcome to the GetSequence App!');
    
    var appContext = $('[data-app-name="getSequence-app"]');
    
    window.addEventListener('Agave::ready', function() {

	// Initialize some variables
	var Agave = window.Agave;		
	var geneIdentifier = '';
	var revComp = '';
	var flankLength = 0;
	var revSeq = false;
	var chromosomeId = '';
	var startCoordinate = 0;
	var endCoordinate = 0;
	var curr_id, curr_seq;

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


	/* - - - - - - - - - -  */ 	
	/* Write error messages */
	/* - - - - - - - - - -  */ 
	var showError = function(err) {
	    
	    $('.wait_region').empty();
            $('.error', appContext).html('<div class="alert alert-danger">' + err.obj.message + '</div>');
            console.error('Status: ' + err.obj.status + '  Message: ' + err.obj.message);
	};
	var showError2 = function(err) {
	    
	    $('.wait_region2').empty();
            $('.error2', appContext).html('<div class="alert alert-danger">' + err.obj.message + '</div>');
            console.error('Status: ' + err.obj.status + '  Message: ' + err.obj.message);
	};

	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */ 	
	/* Wrapper function for retrieving and displaying of the sequence by identifier */
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */ 
	var wrapperSequenceByIdentifier = function wrapperSequenceByIdentifier(json) {
	    
	    // Verify the API query was successful
	    if ( ! (json && json.obj) || json.obj.status !== 'success') {
		$('.identifier_results', appContext).html('<div class="alert alert-danger">Error with sequence retrieval!</div>');
		return;
            }
	    
	    var returnedSequences = processSequenceResults(json);

	    // The search is done, hide the waiting bar
	    $('.wait_region').empty();
	    $('.error').empty();
	    
	    // Display the sequence
	    mySequenceI = displaySequence(mySequenceI, returnedSequences[0], returnedSequences[1], "identifier_results");

	    // Create Reverse Complement Button
	    $('#reverse_region', appContext).html('<input type="checkbox" name="revComp" id="revComp" value="0" class="revbox" /><span class="revCompButton"><label for="revComp" class="control-label"><b>Reverse Comp</b></label></span>&nbsp;&nbsp;<span id="download_region"></span>');
	    
	    // Create download button
	    $('#download_region', appContext).html('<button title="DOWLOAD FASTA FORMAT" type="button" class="btn btn-danger" id="download_sequence">Download</button>');
	    
	    // If the reverse complement button is checked
	    $('#revComp').on('click', function() {
		revSeq = $("#revComp").is(":checked");

		if ( revSeq === true ){
		    var reversedArray = processRevComp(returnedSequences[0], returnedSequences[2], returnedSequences[3], returnedSequences[4]);
		    mySequenceI = displaySequence(mySequenceI, reversedArray[0], reversedArray[1], "identifier_results");
		} else {
		    mySequenceI = displaySequence(mySequenceI, returnedSequences[0], returnedSequences[1], "identifier_results");
		}
	    });

	    $('#download_sequence').on('click', function() {

		var content = '>' + curr_id + '\n' + curr_seq;
		var dl = document.createElement('a');
		dl.setAttribute('id', 'sequence.txt');
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
	}
	
	
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */ 	
	/* Wrapper function for retrieving and displaying of the sequence by location   */
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */ 
	var wrapperSequenceByLocation = function wrapperSequenceByLocation(json) {

	    // Verify the API query was successful
	    if ( ! (json && json.obj) || json.obj.status !== 'success') {
		$('.location_results', appContext).html('<div class="alert alert-danger">Error with sequence retrieval!</div>');
		return;
            }
	    
	    var returnedSequences = processSequenceResults(json);

	    // The search is done, hide the waiting bar
	    $('.wait_region2').empty();
	    $('.error2').empty();
	    
	    // Display the sequence
	    mySequenceL = displaySequence(mySequenceL, returnedSequences[0], returnedSequences[1], "location_results");

	    // Create Reverse Complement Button
	    $('#reverse_region2', appContext).html('<input type="checkbox" name="revComp2" id="revComp2" value="0" class="revbox" /><span class="revCompButton"><label for="revComp2" class="control-label"><b>Reverse Comp</b></label></span>&nbsp;&nbsp;<span id="download_region2"></span>');

	    // Create download button
	    $('#download_region2', appContext).html('<button title="DOWLOAD FASTA FORMAT" type="button" class="btn btn-danger" id="download_sequence2">Download</button>');
	    
	    // If the reverse complement button is checked
	    $('#revComp2').on('click', function() {
		revSeq = $("#revComp2").is(":checked");

		if ( revSeq === true ){
		    var reversedArray = processRevComp(returnedSequences[0], returnedSequences[2], returnedSequences[3], returnedSequences[4]);
		    mySequenceL = displaySequence(mySequenceL, reversedArray[0], reversedArray[1], "location_results");
		} else {
		    mySequenceL = displaySequence(mySequenceL, returnedSequences[0], returnedSequences[1], "location_results");
		}
	    });

	    $('#download_sequence2').on('click', function() {

		var content = '>' + curr_id + '\n' + curr_seq;
		var dl = document.createElement('a');
		dl.setAttribute('id', 'sequence.txt');
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
	}
	
	
	/* - - - - - - - - - - - - - - - - - - - - - - -*/ 
	/* Process function for the sequence search - - */
	/* - - - - - - - - - - - - - - - - - - - - - - -*/ 
	function processSequenceResults( json ) {

	    // Begin parsing json
	    var data = json.obj || json;

	    // Extract the sequence
	    var sequence = data.result[0].sequence;	    
	    var start = data.result[0].start;
	    if(start === 0){
		start = 1;
	    }		
	    
	    var end = data.result[0].end;
	    var chromosome = data.result[0].chromosome;
	    var id =  'Sequence ' + 'Location=' + chromosome + '..' + start + '-' + end + ' ReverseComplemented=False' + ' FlankLength=' + flankLength;

	    // return sequences and ids
	    return [sequence,id,chromosome,start,end];
	}



	/* - - - - - - - - - - - - - - - - - - - - - - */ 
	/* Reverse complement the sequence - - - - - - */
	/* - - - - - - - - - - - - - - - - - - - - - - */ 
	function processRevComp(seq, chr, start, end) {
	    
	    var loadSequence = new Nt.Seq();
	    loadSequence.read(seq);
	    var r_sequence = loadSequence.complement().sequence();
	    var r_id = 'Sequence ' + 'Location=' + chr + '..' + start + '-' + end + ' ReverseComplemented=True' + ' FlankLength=' + flankLength;

	    return [r_sequence,r_id];
	}
	
	/* - - - - - - - - - - - - - - - - - - - - - - */ 
	/* Display function for the sequence - - - - - */
	/* - - - - - - - - - - - - - - - - - - - - - - */ 
	function displaySequence(BioJsObj, seq, id, loc) {
	    
	    // repopulate BioJS sequence object and display
	    $('.wait_region2').empty();
	    BioJsObj.clearSequence();
	    BioJsObj = new Sequence({
		sequence : seq,
		target : loc,
		format : 'FASTA',
		numCols: 80,
		id : id,
	    });

	    // Hide the formatter
	    BioJsObj.hideFormatSelector();

	    curr_id = id;
	    curr_seq = seq;
	    
	    return BioJsObj;
	}
		
	/* - - - -Done with- -- - - -  */
	/* - - - the functions! - - -  */





	    

	/* - - - - -  */
	/* Start here */
	/* - - - - -  */
	init();

	// Initialize a BioJs sequence
	var mySequenceI = new Sequence({
	    sequence : '\n\n\n\n\n\n',
	    target : 'identifier_results',
	    format : 'FASTA',
	    numCols: 60,
	    id : 'Sequence',
	});
	mySequenceI.hideFormatSelector();
	
	var mySequenceL = new Sequence({
	    sequence : '\n\n\n\n\n\n',
	    target : 'location_results',
	    format : 'FASTA',
	    numCols: 60,
	    id : 'Sequence',
	});
	mySequenceL.hideFormatSelector();
	
	// Setup clear button functions
	$('#identifier_search_form_reset').on('click', function() {
            $('.error').empty();
	    $('.wait_region').empty();
            $('.identifier_results').empty();
            $('#geneIdentifier').val('AT1G01210');
	    $('#flankLen').val('0');
	    $("#revComp").prop("checked", false);
	    $('#download_region').empty();
	    $('#reverse_region').empty();
	    
	    mySequenceI.clearSequence();
	    mySequenceI = new Sequence({
		sequence : '\n\n\n\n\n\n',
		target : 'identifier_results',
		format : 'FASTA',
		numCols: 60,
		id : 'Sequence',
	    });
	    mySequenceI.hideFormatSelector();
	});
	
	$('#location_search_form_reset').on('click', function() {
            $('.error2').empty();
	    $('.wait_region2').empty();
            $('.location_results').empty();
            $('#chromosomeId').val('Chr1');
            $('#startCoordinate').val('1');
	    $('#endCoordinate').val('1000');
	    $("#revComp2").prop("checked", false);
	    $('#download_region2').empty();
	    $('#reverse_region2').empty();
	    
	    mySequenceL.clearSequence();
	    mySequenceL = new Sequence({
		sequence : '\n\n\n\n\n\n',
		target : 'location_results',
		format : 'FASTA',
		numCols: 60,
		id : 'Sequence',
	    });
	    mySequenceL.hideFormatSelector();
	});


	// Setup the download buttons
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

	
	// Setup submit button functions which call the main wrapper function
	$('form[name=identifier_search_form]',appContext).on('submit',function(e){
	    
            log( 'Searching by identifier...' );
	    
            e.preventDefault();
	    
	    $('.wait_region', appContext).html('<div id="loader_icon"><img src="https://apps.araport.org/jbrowse/plugins/EnsemblVariants/img/ajax-loader.gif"></div>');
	    
	    document.getElementById("wait_region").style.display="block";

	    // Assign input parameters to global variables
	    geneIdentifier = this.geneIdentifier.value;
	    flankLength = this.flankLen.value;
	    
	    // clear current display/errors
	    $('.identifier_results').empty();
            $('.error').empty();
	    $("#revComp").prop("checked", false);
	    $('#download_region').empty();
	    
	    // setup query parameters
	    var params = {
		identifier: geneIdentifier,
		flank: flankLength
	    };
	    
	    // Run the query
	    Agave.api.adama.search({
		'namespace': 'aip',
		'service': 'get_sequence_by_identifier_v0.2',
		'queryParams': params
	    }, wrapperSequenceByIdentifier, showError);
	    
	    /* - - - */
	    /* Done! */
	    /* - - - */
	});

	$('form[name=location_search_form]',appContext).on('submit',function(e){

	    log( 'Searching by coordinate...' );
	    
            e.preventDefault();

	    $('.wait_region2', appContext).html('<div id="loader_icon"><img src="https://apps.araport.org/jbrowse/plugins/EnsemblVariants/img/ajax-loader.gif"></div>');

	    // Assign input parameters to global variables
	    chromosomeId = this.chromosomeId.value;
	    startCoordinate = this.startCoordinate.value;
	    endCoordinate = this.endCoordinate.value;
	    revSeq = $("#revComp2").is(":checked");

	    // clear current display/errors
	    $('.location_results').empty();
            $('.error2').empty();
	    $("#revComp2").prop("checked", false);
	    $('#download_region2').empty();
	    
	    // setup query parameters
	    var params = {
		chromosome: chromosomeId,
		start: startCoordinate,
		end: endCoordinate,
		flank: 0
	    };

	    var seqLen = endCoordinate - startCoordinate;

	    if ( seqLen >= 100000) {
		$('.error2', appContext).html('<div class="alert alert-danger">This could take a while! Thank you for your patience.</div>');
	    }

	    if ( seqLen < 999999){
		
		// wrapper function to run the whole sequence retrieval and display
		// Run the query
		Agave.api.adama.search({
		    'namespace': 'aip',
		    'service': 'get_sequence_by_coordinate_v0.2',
		    'queryParams': params
		}, wrapperSequenceByLocation, showError2);
	    }else {

		$('.wait_region2').empty();
		// Do not execute
		$('.error2', appContext).html('<div class="alert alert-danger">The requested sequence size exceeds the maximum!</div>');
	    }
	    
	    /* - - - */
	    /* Done! */
	    /* - - - */
	}); 
	
    });
    
})(window, jQuery);
