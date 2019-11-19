# Wiki Circuit - Server

## Project Overview
Wiki Circuit allows users to analyze connectivity between Wikipedia articles. The application downloads an initial input
article. From this input, it will find all the links to other articles inside the body and download the linked articles. 
It will precede to download articles in a recursive fashion upto a specified depth. The links will be parsed and counted 
to build a map of which articles are linked to each other. 

In a web user interface, the generated data is used to display diagrams to visualize the linkage between articles. The user
can select diagram segments to drill down into the data in a more detail. The UI piece is still a work in progress.

Wiki Circuit requires two components to function:

* [https://github.com/LinkedMink/wiki-circuit-client](https://github.com/LinkedMink/wiki-circuit-client)
* [https://github.com/LinkedMink/wiki-circuit-server (Current Project)](https://github.com/LinkedMink/wiki-circuit-server)

Note that the code was never written to be production ready. It was written mainly to demonstrate the various technologies
used to build the software.

## Server Project
This project host an API for managing jobs that download Wikipedia article data and builds a map of which articles link to 
each other. The project includes routes to start a job, get the result/status, and view an index of all jobs in progress. 

### Sample App
Try it out: [http://wiki-circuit.apps.linkedmink.space/](http://wiki-circuit.apps.linkedmink.space/)

## Scripts
To run the application, install cross-env globally.

```bash
npm install -g cross-env
```

In the project directory, you can run:

### `npm start`
Build and the run the server application.

### `npm run build`
Only build the application.

### `npm run startApp`
Run the existing built application without rebuilding

### `npm run watch`
Continuously watch for changes in the TypeScript files. Rebuild application whenever a change is detected.

### `npm test`
Run the unit test and generate a coverage report.

### `npm run lint`
Run the linter on the src directory.

### `npm run lintTest`
Run the linter on the tests directory.

### `npm run containerize`
Package the application as a docker container.

## Deployment - Docker
There is no requirement to run on docker, but the project has been configured to do so if desired. Install 
the development dependencies for both the server and client.

```bash
npm install -g cross-env
cd ./wiki-circuit-server
npm install
cd ../wiki-circuit-client
npm install
```

Containerize both the server and client application. You will have to set the server URL at build time for 
the client app since it's contained in the built bundle.

```bash
cd ./wiki-circuit-server
npm run containerize
cd ../wiki-circuit-client
npx cross-env REACT_APP_SERVER_BASE_URL=https://api.mydomain.com:55000 \
  npm run containerize
```

Run the containers on the target machine. Networking can be configured by environmental variables.

```bash
docker run -d \
  -p 55000:8080 \
  -e ALLOWED_ORIGINS=http://mydomain.com:8080 \
  --name wiki-circuit-server \
  linkedmink/wiki-circuit-server

docker run -d \
  -p 8080:80 \
  --name wiki-circuit-client \
  linkedmink/wiki-circuit-client
```

## Routes

### GET /
Return a success response to check that the server is alive.

#### Response
```json
{
  "status": "success",
  "message": "",
  "data": null
}
```

### GET /article
Return a list of the job IDs that are currently in the cache.

#### Response
```json
{
  "status": "success",
  "message": "",
  "data": [
    "boygenius",
    "article_2"
  ]
}
```

### POST /article
Submit a new job with the body containing the article name as the ID of the job.

#### Request
```json
{ 
  "id": "boygenius" 
}
```

#### Response
```json
{
  "status": "success",
  "message": "Job started: boygenius",
  "data": null
}
```

### GET /article/{id}
Get the status of a job. After a job completes, the result will be included with the status.

#### Response
```json
{
  "status": "success",
  "message": "",
  "data": {
    "status": "running",
    "id": "boygenius",
    "progress": {
      "completed": 0.1046808510638298,
      "message": "",
      "data": [
        {
          "links": 1481,
          "queued": 1175,
          "downloaded": 123,
          "depth": 0
        },
        {
          "links": 1,
          "queued": 1,
          "downloaded": 1,
          "depth": 1
        },
        {
          "links": 12,
          "queued": 7,
          "downloaded": 7,
          "depth": 2
        },
        {
          "links": 1468,
          "queued": 1167,
          "downloaded": 115,
          "depth": 3
        }
      ]
    },
    "startTime": 1572465543334,
    "endTime": 0,
    "runTime": 0,
    "result": null
  }
}
```

## Data

### ID
All routes use the same article ID to identify the links between articles and the input parameters to submit 
jobs. Articles in Wikipedia have an identifier in the URL that unique represents a page that can be returned:

```
https://en.wikipedia.org/wiki/Boygenius
ID = Boygenius
https://en.wikipedia.org/wiki/Duluth,_Minnesota
ID = Duluth,_Minnesota
```

### Job Result
```json
"result": [
  {
    "id": "MusicBrainz",
    "depth": 3,
    "referenceCount": 542,
    "linkedArticles": {
      "MetaBrainz_Foundation": 2,
      "Alexa_Internet": 1,
      "Registered_user": 1,
      "Creative_Commons_Zero": 1,
      "Open_data": 1,
      "CC-BY-NC-SA": 2,
      "Perl": 1,
      "PostgreSQL": 2,
      "Freedb": 2,
      "CDDB": 1,
      "Compact_disc": 1,
      "Metadata_(computing)": 1,
      "Cover_art": 1,
      "Acoustic_fingerprint": 2,
      "ID3_tag": 1,
      "FLAC": 1,
      "MP3": 1,
      "Ogg_Vorbis": 1,
      "Advanced_Audio_Coding": 1,
      "Internet_Archive": 1,
      "Application_programming_interface": 1,
      "Amazon.com": 1,
      "MusicBrainz_Picard": 2,
      "Recursive_acronym": 1,
      "AmpliFIND": 2,
      "AcoustID": 1,
      "Pitch_class": 1,
      "Public_domain": 1,
      "Threshold_of_originality": 1,
      "Creative_Commons": 1,
      "Relational_database_management_system": 1,
      "GNU_General_Public_License": 1,
      "Library_(computing)": 1,
      "GNU_Lesser_General_Public_License": 1,
      "Non-profit": 1,
      "Barcelona": 1,
      "Amarok_(software)": 1,
      "KDE": 1,
      "Banshee_(music_player)": 1,
      "Command-line_interface": 2,
      "Clementine_(software)": 1,
      "CDex": 1,
      "Microsoft_Windows": 1,
      "CD_ripper": 1,
      "MacOS": 1,
      "Foobar_2000": 1,
      "Jaikoz": 1,
      "Java_(programming_language)": 1,
      "Transcode": 1,
      "Mp3tag": 1,
      "Puddletag": 1,
      "Tag_editor": 1,
      "PyQt": 1,
      "GPLv3": 1,
      "Rhythmbox": 1,
      "Sound_Juicer": 1,
      "Windows": 1,
      "List_of_online_music_databases": 1,
      "BBC_Online": 1,
      "Auckland_Art_Gallery_Toi_o_T%C4%81maki": 1,
      "ACM_Digital_Library": 1,
      "Australian_Dictionary_of_Biography": 1,
      "Art_Gallery_of_South_Australia": 1,
      "Autores.uy": 1,
      "Australian_Women%27s_Register": 1,
      "Royal_Institute_for_Cultural_Heritage#Online_artworks_pages": 1,
      "Bibsys": 1,
      "Marburg_Picture_Index": 1,
      "Biblioteca_Nacional_de_Chile": 1,
      "Biblioteca_Nacional_de_Espa%C3%B1a": 1,
      "Biblioth%C3%A8que_nationale_de_France": 1,
      "Author_citation_(botany)": 1,
      "Biografisch_Portaal": 1,
      "Name_and_Title_Authority_File_of_Catalonia": 1,
      "CiNii": 1,
      "Dictionary_of_Australian_Artists": 1,
      "DBLP": 1,
      "Stuttgart_Database_of_Scientific_Illustrators_1450%E2%80%931950": 1,
      "Integrated_Authority_File": 1,
      "Historical_Dictionary_of_Switzerland": 1,
      "International_Association_of_Athletics_Federations": 1,
      "Information_Center_for_Israeli_Art": 1,
      "International_Standard_Name_Identifier": 1,
      "Joconde": 1,
      "KulturNav": 1,
      "Library_of_Congress_Control_Number": 1,
      "Historical_Dictionary_of_Switzerland#Lexicon_Istoric_Retic": 1,
      "National_Library_of_Latvia": 1,
      "Base_L%C3%A9onore": 1,
      "Mathematics_Genealogy_Project": 1,
      "National_Archives_and_Records_Administration": 1,
      "National_Central_Library": 1,
      "National_Diet_Library": 1,
      "National_Gallery_of_Victoria": 1,
      "National_Library_of_the_Czech_Republic": 1,
      "National_Library_of_Australia": 1,
      "National_Library_of_Israel": 1,
      "National_Library_of_Poland": 1,
      "National_Library_of_Romania": 1,
      "National_and_University_Library_in_Zagreb": 1,
      "Royal_Library_of_the_Netherlands": 1,
      "ORCID": 1,
      "ResearcherID": 1,
      "RERO_(Library_Network_of_Western_Switzerland)": 1,
      "Netherlands_Institute_for_Art_History#Online_artist_pages": 1,
      "Russian_State_Library": 1,
      "Istituto_Centrale_per_il_Catalogo_Unico": 1,
      "LIBRIS": 1,
      "SIKART": 1,
      "SNAC": 1,
      "Syst%C3%A8me_universitaire_de_documentation": 1,
      "Semantic_Scholar": 1,
      "Terminologia_Anatomica": 1,
      "Terminologia_Embryologica": 1,
      "Museum_of_New_Zealand_Te_Papa_Tongarewa": 1,
      "Terminologia_Histologica": 1,
      "Theaterlexikon_der_Schweiz": 1,
      "Trove": 1,
      "Union_List_of_Artist_Names": 1,
      "Biographical_Directory_of_the_United_States_Congress": 1,
      "Virtual_International_Authority_File": 1
    }
  },
  {
    "id": "Library_of_Congress_Control_Number",
    "depth": 3,
    "referenceCount": 439,
    "linkedArticles": {
      "Serial_number": 1,
      "Library_of_Congress": 1,
      "Library_of_Congress_Classification": 1,
      "Library_catalog": 1,
      "Librarian": 1,
      "Identifier": 1,
      "Check_digit": 1,
      "Hyphen": 1,
      "Library_of_Congress_Subject_Headings": 1,
      "Authority_control": 1,
      "Virtual_International_Authority_File": 2,
      "CODEN": 1,
      "Integrated_Authority_File": 2,
      "International_Standard_Book_Number": 1,
      "Books_in_the_United_States": 1,
      "Wikidata": 1,
      "Wayback_Machine": 1,
      "Auckland_Art_Gallery_Toi_o_T%C4%81maki": 1,
      "ACM_Digital_Library": 1,
      "Australian_Dictionary_of_Biography": 1,
      "Art_Gallery_of_South_Australia": 1,
      "Autores.uy": 1,
      "Australian_Women%27s_Register": 1,
      "Royal_Institute_for_Cultural_Heritage#Online_artworks_pages": 1,
      "Bibsys": 1,
      "Marburg_Picture_Index": 1,
      "Biblioteca_Nacional_de_Chile": 1,
      "Biblioteca_Nacional_de_Espa%C3%B1a": 1,
      "Biblioth%C3%A8que_nationale_de_France": 1,
      "Author_citation_(botany)": 1,
      "Biografisch_Portaal": 1,
      "Name_and_Title_Authority_File_of_Catalonia": 1,
      "CiNii": 1,
      "Dictionary_of_Australian_Artists": 1,
      "DBLP": 1,
      "Stuttgart_Database_of_Scientific_Illustrators_1450%E2%80%931950": 1,
      "Historical_Dictionary_of_Switzerland": 1,
      "International_Association_of_Athletics_Federations": 1,
      "Information_Center_for_Israeli_Art": 1,
      "International_Standard_Name_Identifier": 1,
      "Joconde": 1,
      "KulturNav": 1,
      "Historical_Dictionary_of_Switzerland#Lexicon_Istoric_Retic": 1,
      "National_Library_of_Latvia": 1,
      "Base_L%C3%A9onore": 1,
      "MusicBrainz": 1,
      "Mathematics_Genealogy_Project": 1,
      "National_Archives_and_Records_Administration": 1,
      "National_Central_Library": 1,
      "National_Diet_Library": 1,
      "National_Gallery_of_Victoria": 1,
      "National_Library_of_the_Czech_Republic": 1,
      "National_Library_of_Australia": 1,
      "National_Library_of_Israel": 1,
      "National_Library_of_Poland": 1,
      "National_Library_of_Romania": 1,
      "National_and_University_Library_in_Zagreb": 1,
      "Royal_Library_of_the_Netherlands": 1,
      "ORCID": 1,
      "ResearcherID": 1,
      "RERO_(Library_Network_of_Western_Switzerland)": 1,
      "Netherlands_Institute_for_Art_History#Online_artist_pages": 1,
      "Russian_State_Library": 1,
      "Istituto_Centrale_per_il_Catalogo_Unico": 1,
      "LIBRIS": 1,
      "SIKART": 1,
      "SNAC": 1,
      "Syst%C3%A8me_universitaire_de_documentation": 1,
      "Semantic_Scholar": 1,
      "Terminologia_Anatomica": 1,
      "Terminologia_Embryologica": 1,
      "Museum_of_New_Zealand_Te_Papa_Tongarewa": 1,
      "Terminologia_Histologica": 1,
      "Theaterlexikon_der_Schweiz": 1,
      "Trove": 1,
      "Union_List_of_Artist_Names": 1,
      "Biographical_Directory_of_the_United_States_Congress": 1
    }
  },
  ...
]
```
