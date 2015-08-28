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
	var lowerCase = false;
	var chromosomeId = '';
	var startCoordinate = 0;
	var endCoordinate = 0;
	var curr_id, curr_seq; //for download purposes
	var chromloc = '';
	var sequenceIdentifier = 'Sequence';
	var fullSequenceIdentifier = 'Sequence';
	var orig_sequence='';
	
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
	    mySequenceI = displaySequence(mySequenceI, returnedSequences[0], returnedSequences[1], "#identifier_results", IUID);	      
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
	    mySequenceL = displaySequence(mySequenceL, returnedSequences[0], returnedSequences[1], "#location_results", LUID);
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
	    var s_adjust;
	    console.log(start);
	    if(start < 1){
		start = 1;
		s_adjust = 1;
	    }else{
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

	    if(start < 1 || startCoordinate == 1){
		start = 1;
		s_adjust = 1;
	    }else{
		s_adjust = start + 1;
	    }
	    
	    var r_id = sequenceIdentifier + ' Location=' + chr + '..' + s_adjust + '-' + end + ' ReverseComplemented=true';
	    
	    return [r_sequence,r_id];
	}
	
	/* - - - - - - - - - - - - - - - - - - - - - - */ 
	/* Display function for the sequence - - - - - */
	/* - - - - - - - - - - - - - - - - - - - - - - */ 
	function displaySequence(BioJsObj, seq, id, loc, uid) {
	    
	    // repopulate BioJS sequence object and display
	    $('.wait_region2').empty();

	    if(loc === '#identifier_results'){
		fullSequenceIdentifier = id + ' FlankLength=' + flankLength;
	    }else{
		fullSequenceIdentifier = id + ' FlankLength=0';
		flankLength=0;
	    }
	    
	    BioJsObj = new Sequence($,seq,sequenceIdentifier);
	    BioJsObj.render(loc, {
		'showLineNumbers': true,
		'wrapAminoAcids': true,
		'charsPerLine': 50,
		'toolbar': true,
		'search': true,
		'id': uid,
		'location': chromloc,
		'flank': flankLength,
		'revComp': revSeq
	    });

	    var seqlen = parseInt(endCoordinate) - parseInt(startCoordinate);
	    if( flankLength > 0 && loc === '#identifier_results') {

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
	    'charsPerLine': 50,
	    'toolbar': true,
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
	    'charsPerLine': 50,
	    'toolbar': true,
	    'search': true,
	    'id': LUID,
	    'location': chromloc,
	    'flank': 0,
	    'revComp': false
	});

	
	// Setup clear button functions
	$('#identifier_search_form_reset').on('click', function() {
            $('.error').empty();
	    $('.wait_region').empty();
            $('#identifier_results').empty();
            $('#geneIdentifier').val('AT1G01210');
	    $('#flankLen').val('0');
	    $("#revComp").prop("checked", false);
	    $("#lowerCase").prop("checked", false);

	    // reset to initial example
	    sequenceIdentifier = example_id;
	    fullSequenceIdentifier = example_id + ' Location=Chr1..88898-89745 ReverseComplemented=False FlankLength=0';
	    curr_seq = example_sequence;
	    orig_sequence = example_sequence;
	    chromosomeId = 'Chr1';
	    startCoordinate = 88897;
	    endCoordinate = 89745;
	    chromloc = 'Chr1..' + (startCoordinate+1) + '-' + endCoordinate;
	    
	    mySequenceI = new Sequence($,example_sequence,example_id);
	    mySequenceI.render('#identifier_results', {
		'showLineNumbers': true,
		'wrapAminoAcids': true,
		'charsPerLine': 50,
		'toolbar': true,
		'search': true,
		'id': IUID,
		'location': chromloc,
		'flank': 0,
		'revComp': false
	    });
	});
	
	$('#location_search_form_reset').on('click', function() {
            $('.error2').empty();
	    $('.wait_region2').empty();
            $('#location_results').empty();
            $('#chromosomeId').val('Chr1');
            $('#startCoordinate').val('1');
	    $('#endCoordinate').val('1000');
	    $("#revComp2").prop("checked", false);
	    $("#lowerCase2").prop("checked", false);
	    
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
		'charsPerLine': 50,
		'toolbar': true,
		'search': true,
		'id': LUID,
		'location': chromloc,
		'flank': 0,
		'revComp': false
	    });
	});
	
	// Setup submit button functions which call the main wrapper function
	$('form[name=identifier_search_form]',appContext).on('submit',function(e){

	    log( 'Searching by identifier...' );

	    // uncheck checkboxes
	    $("#revComp").prop("checked", false);
	    $("#lowerCase").prop("checked", false);
	    
            e.preventDefault();
	    
	    $('.wait_region', appContext).html('<div id="loader_icon"><img src="https://apps.araport.org/jbrowse/plugins/EnsemblVariants/img/ajax-loader.gif"></div>');
	    
	    document.getElementById("wait_region").style.display="block";

	    // Assign input parameters to global variables
	    geneIdentifier = this.geneIdentifier.value;
	    sequenceIdentifier = geneIdentifier;
	    flankLength = this.flankLen.value;
	    
	    // clear current display/errors
	    $('#identifier_results').empty();
            $('.error').empty();
	    $("#revComp").prop("checked", false);
	    
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
	});

	$('form[name=location_search_form]',appContext).on('submit',function(e){

	    log( 'Searching by coordinate...' );

	    // uncheck checkboxes
	    $("#revComp2").prop("checked", false);
	    $("#lowerCase2").prop("checked", false);
	    
            e.preventDefault();

	    $('.wait_region2', appContext).html('<div id="loader_icon"><img src="https://apps.araport.org/jbrowse/plugins/EnsemblVariants/img/ajax-loader.gif"></div>');

	    // Assign input parameters to global variables
	    chromosomeId = this.chromosomeId.value;
	    startCoordinate = this.startCoordinate.value;
	    endCoordinate = this.endCoordinate.value;
	    revSeq = $("#revComp2").is(":checked");
	    sequenceIdentifier = "Sequence";
	    
	    // clear current display/errors
	    $('#location_results').empty();
            $('.error2').empty();
	    $("#revComp2").prop("checked", false);
	    
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
	});

	
	// If the reverse complement button is checked
	$('#revComp').on('click', function() {
	    revSeq = $("#revComp").is(":checked");
	    lowerCase = $("#lowerCase").is(":checked");
	    
	    var lowerCaseSeq = '';

	    var s_adjust;
	    if(startCoordinate < 1){
		s_adjust = 1;
	    }else{
		s_adjust = startCoordinate + 1;
	    }
	    
	    if ( revSeq === true ){
		
		var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
		
		if( lowerCase === true) {
		    lowerCaseSeq = reversedArray[0].toLowerCase();
		    mySequenceI = displaySequence(mySequenceI, lowerCaseSeq, reversedArray[1], "#identifier_results", IUID);
		}else {
		    mySequenceI = displaySequence(mySequenceI, reversedArray[0], reversedArray[1], "#identifier_results", IUID);
		}

	    } else {

		fullSequenceIdentifier =  sequenceIdentifier + ' Location=' + chromosomeId + '..' + s_adjust + '-' + endCoordinate + ' ReverseComplemented=false';
		
		if( lowerCase === true) {
		    lowerCaseSeq = orig_sequence.toLowerCase();
		    mySequenceI = displaySequence(mySequenceI, lowerCaseSeq, fullSequenceIdentifier, "#identifier_results", IUID);
		}else {
		    mySequenceI = displaySequence(mySequenceI, orig_sequence, fullSequenceIdentifier, "#identifier_results", IUID);
		}
	    }
	});
	
	$('#download_sequence').on('click', function() {
	    
	    var content = '>' + fullSequenceIdentifier + '\n' + curr_seq;
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

	
	// If the reverse complement button is checked
	$('#lowerCase').on('click', function() {
	    lowerCase = $("#lowerCase").is(":checked");
	    revSeq = $("#revComp").is(":checked");
	    
	    var lowerCaseSeq = '';
	    
	    if ( lowerCase === true ){

		if(revSeq === true) {
		    var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
		    lowerCaseSeq = reversedArray[0].toLowerCase();
		    mySequenceI = displaySequence(mySequenceI, lowerCaseSeq, reversedArray[1], "#identifier_results", IUID);
		}else{
		    lowerCaseSeq = orig_sequence.toLowerCase();
		    mySequenceI = displaySequence(mySequenceI, lowerCaseSeq, fullSequenceIdentifier, "#identifier_results", IUID);
		}
	    } else {
		if(revSeq === true) {
		    var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
		    mySequenceI = displaySequence(mySequenceI, reversedArray[0], reversedArray[1], "#identifier_results", IUID);
		}else{
		    mySequenceI = displaySequence(mySequenceI, orig_sequence, fullSequenceIdentifier, "#identifier_results", IUID);
		}
	    }
	});


	
	// If the reverse complement button is checked
	$('#revComp2').on('click', function() {
	    revSeq = $("#revComp2").is(":checked");
	    lowerCase = $("#lowerCase2").is(":checked");
	    
	    var lowerCaseSeq = '';
	    
	    if ( revSeq === true ){
		
		var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
		
		if( lowerCase === true) {
		    lowerCaseSeq = reversedArray[0].toLowerCase();
		    mySequenceL = displaySequence(mySequenceL, lowerCaseSeq, reversedArray[1], "#location_results", LUID);
		}else {
		    mySequenceL = displaySequence(mySequenceL, reversedArray[0], reversedArray[1], "#location_results", LUID);
		}

	    } else {

		var s_adjust;

		if(startCoordinate < 1){
		    s_adjust = 1;
		}else{
		    s_adjust = startCoordinate + 1;
		}
		
		fullSequenceIdentifier =  sequenceIdentifier + ' Location=' + chromosomeId + '..' + s_adjust + '-' + endCoordinate + ' ReverseComplemented=false';
		
		if( lowerCase === true) {
		    lowerCaseSeq = orig_sequence.toLowerCase();
		    mySequenceL = displaySequence(mySequenceL, lowerCaseSeq, fullSequenceIdentifier, "#location_results", LUID);
		}else {
		    mySequenceL = displaySequence(mySequenceL, orig_sequence, fullSequenceIdentifier, "#location_results", LUID);
		}
	    }
	});
	
	$('#download_sequence2').on('click', function() {
	    
	    var content = '>' + fullSequenceIdentifier + '\n' + curr_seq;
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
	    

	// If the reverse complement button is checked
	$('#lowerCase2').on('click', function() {
	    lowerCase = $("#lowerCase2").is(":checked");
	    revSeq = $("#revComp2").is(":checked");
	    
	    var lowerCaseSeq = '';

	    if ( lowerCase === true ){

		if(revSeq === true) {
		    var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
		    lowerCaseSeq = reversedArray[0].toLowerCase();
		    mySequenceL = displaySequence(mySequenceL, lowerCaseSeq, reversedArray[1], "#location_results", LUID);
		}else{
		    lowerCaseSeq = orig_sequence.toLowerCase();
		    mySequenceL = displaySequence(mySequenceL, lowerCaseSeq, fullSequenceIdentifier, "#location_results", LUID);
		}
	    } else {
		
		if(revSeq === true) {
		    var reversedArray = processRevComp(orig_sequence,chromosomeId,startCoordinate,endCoordinate);
		    mySequenceL = displaySequence(mySequenceL, reversedArray[0], reversedArray[1], "#location_results", LUID);
		}else{
		    mySequenceL = displaySequence(mySequenceL, orig_sequence, fullSequenceIdentifier, "#location_results", LUID);
		}
	    }
	});
	
	/* - - - */
	/* Done! */
	/* - - - */
    });
    
})(window, jQuery);
