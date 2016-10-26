#!/usr/bin/env python

# Dependencies
# pioai - OAI-PMH Python Module - http://infrae.com/download/OAI/pyoai

from oaipmh.client import Client
from oaipmh.metadata import MetadataRegistry, oai_dc_reader

oaiSourceURL = 'http://digitalrepository.unm.edu/do/oai/'

registry = MetadataRegistry()
registry.registerReader('oai_dc', oai_dc_reader)
client = Client(oaiSourceURL, registry)

with open("output.txt","w") as outfile:
    for record in client.listRecords(metadataPrefix='oai_dc', max=10):
        outfile.write(repr(record)+"\n")
