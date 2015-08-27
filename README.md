# Get-Sequence App v2.0

Retrieve a sequence from A. thaliana Col-0 genome

Get a sequence by searching with a gene locus id or by providing a genome coordinate. This app uses the [NtSeq](https://github.com/keithwhor/NtSeq) library for the sequence manipulations and the [BioJS Sequence Component](https://cdn.rawgit.com/calipho-sib/sequence-viewer/master/examples/index.html) to display the sequences in various formats. The sequences are retrieved with one of Araport's [Get_Sequence](https://github.com/Arabidopsis-Information-Portal/Get_Sequence_API) APIs. 

An [Araport](http://www.araport.org) Science App created using [Yeoman](http://yeoman.io)
and the [Araport science app generator](https://www.npmjs.org/package/generator-aip-science-app).

## App Code

The application code is in the `app/` subdirectory:

```
.
+-- app/
|   +-- app.html
|   +-- scripts/
|       +-- app.js
|   +-- styles/
|       +-- app.css

```

