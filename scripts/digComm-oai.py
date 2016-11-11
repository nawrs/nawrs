# 2015-02-06
# Jon Wheeler
# This code is licensed under a Creative Commons Attribution 4.0 International (CC BY 4.0) License
# http://creativecommons.org/licenses/by/4.0/

# a tool for harvesting metadata from oai-pmh repositories


# import any necessary system libraries
import string
import os
import xml.dom.minidom
import json
import urllib
import urllib2
import re
import codecs
from xmljson import badgerfish as bf
from xml.etree.ElementTree import fromstring, Element, tostring

def oaiItemHarvest(oaiURL, identifier, autoNum):
    params = urllib.urlencode({'verb': 'GetRecord',
                               'metadataPrefix': 'dcs',
                               'identifier': identifier})
    requestURL = oaiURL + "?" + params
    request = urllib2.Request(requestURL)
    response = urllib2.urlopen(request)
    result = response.read()
    uRes = codecs.decode(result, 'utf-8')
    oaiXML = xml.dom.minidom.parseString(uRes.encode("utf-8"))
    with codecs.open(str(autoNum) + '.xml', 'w', encoding='utf-8') as dataz:
            oaiXML.writexml(dataz, indent='', newl='')
    with open(str(autoNum) + '.json', 'wb') as outFile:
        json.dump(bf.data(fromstring(uRes.encode('utf-8'))), outFile)
    return

def oaiResume(oaiURL, oaiXML):
    # get resumption token and build new URL
    rToken = oaiXML.getElementsByTagNameNS('*', 'resumptionToken')
    strToken = rToken[0].firstChild.nodeValue
    params = urllib.urlencode({'verb': 'ListRecords',
                               'resumptionToken': strToken})
    requestURL = oaiURL + '/request?' + params
    # remove existing resumptionToken from XML
    ListRecs = oaiXML.getElementsByTagNameNS('*', 'ListRecords')
    ListRecs[0].removeChild(rToken[0])
    # send the request
    request = urllib2.Request(requestURL)
    response = urllib2.urlopen(request)
    result = response.read()
    uRes = codecs.decode(result, 'utf-8')
    rXML = xml.dom.minidom.parseString(uRes.encode("utf-8"))
    # append all returned ListRecords children
    recs = rXML.getElementsByTagNameNS('*', 'record')
    for child in recs:
        ListRecs[0].appendChild(child)
    # see if there is another resumptionToken
    # if so, append to oaiXML and recurse
    rToken2 = rXML.getElementsByTagNameNS('*', 'resumptionToken')
    if len(rToken2) == 1:
        if rToken2[0].firstChild:
            ListRecs[0].appendChild(rToken2[0])
            oaiResume(oaiURL, oaiXML)
    return oaiXML
    

# Request collection level metadata via the dspace OAI-PMH interface
# currently brute-force requesting oai_dc, but __main__ can be easily
# edited to allow users to request metadata formats and select accordingly
def oaiHarvest(oaiURL, getSet):
    oaiColHandle = "output_" + "nawrs"
    params = urllib.urlencode({'verb': 'ListRecords',
                               'metadataPrefix': 'dcs',
                               'set': getSet})
    requestURL = oaiURL  + "?" + params
    request = urllib2.Request(requestURL)
    response = urllib2.urlopen(request)
    result = response.read()
    uRes = codecs.decode(result, 'utf-8')
    oaiXML = xml.dom.minidom.parseString(uRes.encode("utf-8"))
    # check if there is a resumptionToken
    # if there is, make a follow up request
    # and append <record> elements from request
    # to existing XML
    # alternatively, we can save all requests/responses
    rToken = oaiXML.getElementsByTagNameNS('*', 'resumptionToken')
    if len(rToken) == 0:
        with codecs.open(oaiColHandle + '.xml', 'w', encoding='utf-8') as data:
            oaiXML.writexml(data, indent='', newl='')
    else:
        resumeXML = oaiResume(oaiURL, oaiXML)
        with codecs.open(oaiColHandle + '.xml', 'w', encoding='utf-8') as data:
            resumeXML.writexml(data, indent='', newl='')
    records = oaiXML.getElementsByTagNameNS('*', 'identifier')
    autoNum = 0
    for record in records:
        value = record.firstChild.nodeValue
        protocol = re.compile('oai')
        getOAI = protocol.match(value)
        if getOAI:
            autoNum = autoNum + 1
            oaiItemHarvest(oaiURL, value, autoNum)
    return


def main():
    # get the path separator
    sep = os.path.sep
    
    # get the working directory
    pDir = raw_input('Enter the full path to the working directory: ')
    os.chdir(pDir)

    # if needed, create a new directory for the XML files
    check1 = raw_input('Do you need to create a root directory ' +
                        'for the XML (y or n)? ')
    if check1 == 'y':
        rDir = raw_input('Enter the name of the new directory (no spaces!): ')
        os.mkdir('./' + rDir)
        pDir = pDir + sep + rDir
        os.chdir(pDir)

    # just to be sure, confirm that the target directory is correct
    # as written, this is also a double check that the PWD is correct
    print 'The XML will be downloaded to: ' + os.getcwd()
    check2 = raw_input('Is this correct (y or n)? ')
    if check2 == 'n':
        print 'Exiting. Please determine where the files will be saved'
        print 'and re-run "main()" when ready.'
        exit()
    
    pErrs = open('pathErrors.txt', 'w')
    pErrs.close()
    
    eCols = open('emptyCollectons.txt', 'w')
    eCols.close()
    
    # get the base URL for OAI-PMH interface
    oaiURL = "http://digitalrepository.unm.edu/do/oai/"
    # oaiURL = raw_input('Enter the base URL for the OAI-PMH service: ' )

    getSet = "publication:nawrs"

    oaiHarvest(oaiURL, getSet)

if __name__ == "__main__":
    main()
