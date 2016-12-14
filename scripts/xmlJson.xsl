<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:OAI-PMH="http://www.openarchives.org/OAI/2.0/" xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="xs" version="1.0">
    <xsl:output method="text"/>
    <xsl:strip-space elements="*"/>
    <xsl:template match="/OAI-PMH:OAI-PMH/OAI-PMH:responseDate"/>
    <xsl:template match="/OAI-PMH:OAI-PMH/OAI-PMH:request"/>
    <xsl:template match="/OAI-PMH:OAI-PMH/OAI-PMH:GetRecord/OAI-PMH:record/OAI-PMH:header"/>


    <xsl:template match="oai_dc:dc">
        <xsl:text>{</xsl:text>
        <xsl:text>"title": "</xsl:text>
        <xsl:value-of select="dc:title"/>
        <xsl:text>",</xsl:text>
        <xsl:text>"date": "</xsl:text>
        <xsl:value-of select="dc:date"/>
        <xsl:text>",</xsl:text>
        <xsl:text>"type": "</xsl:text>
        <xsl:value-of select="dc:type"/>
        <xsl:text>",</xsl:text>
        <xsl:text>"identifier": "</xsl:text>
        <xsl:value-of select="dc:identifier"/>
        <xsl:text>",</xsl:text>
        <xsl:text>"centroid": </xsl:text>
        <xsl:value-of select="dc:dc.coverage.spatial.centroid"/>
        <xsl:text>,</xsl:text>
        <xsl:text>"polygon": </xsl:text>
        <xsl:value-of select="dc:dc.coverage.spatial.polygon"/>
        <xsl:text>,</xsl:text>
        <xsl:text>"subject": [</xsl:text>
        <xsl:for-each select="dc:subject">
            <xsl:text>"</xsl:text>
            <xsl:value-of select="."/>
            <xsl:if test="(following-sibling::dc:subject)">
                <xsl:text>",</xsl:text>
            </xsl:if>
            <xsl:if test="not(following-sibling::dc:subject)">
                <xsl:text>"</xsl:text>
            </xsl:if>
        </xsl:for-each>
        <xsl:text>],</xsl:text>
        <xsl:text>"creator": [</xsl:text>
        <xsl:for-each select="dc:creator">
            <xsl:text>"</xsl:text>
            <xsl:value-of select="."/>
            <xsl:if test="(following-sibling::dc:creator)">
                <xsl:text>",</xsl:text>
            </xsl:if>
            <xsl:if test="not(following-sibling::dc:creator)">
                <xsl:text>"</xsl:text>
            </xsl:if>
        </xsl:for-each>
        <xsl:text>],</xsl:text>
        <xsl:text>"description": [</xsl:text>
        <xsl:for-each select="dc:description">
            <xsl:text>"</xsl:text>
            <xsl:value-of select="."/>
            <xsl:if test="(following-sibling::dc:description)">
                <xsl:text>",</xsl:text>
            </xsl:if>
            <xsl:if test="not(following-sibling::dc:description)">
                <xsl:text>"</xsl:text>
            </xsl:if>
        </xsl:for-each>
        <xsl:text>],</xsl:text>
        <xsl:text>"coverage": "</xsl:text>
        <xsl:value-of select="dc:coverage[2]"/>
        <xsl:text>, </xsl:text>
        <xsl:value-of select="dc:coverage[1]"/>
        <xsl:text>"}</xsl:text>
    </xsl:template>

</xsl:stylesheet>
