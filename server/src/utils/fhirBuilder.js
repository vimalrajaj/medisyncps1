import { v4 as uuidv4 } from 'uuid';

export class FhirResourceBuilder {
  static createOperationOutcome(severity, code, details, diagnostics = null) {
    return {
      resourceType: 'OperationOutcome',
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/OperationOutcome']
      },
      issue: [{
        severity,
        code,
        details: {
          text: details
        },
        ...(diagnostics && { diagnostics })
      }]
    };
  }

  static createCodeSystem(id, url, name, title, description, concepts = []) {
    return {
      resourceType: 'CodeSystem',
      id,
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/CodeSystem']
      },
      url,
      identifier: [{
        use: 'official',
        system: 'http://terminology.ayush.gov.in/identifier',
        value: id
      }],
      version: '1.0.0',
      name,
      title,
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      contact: [{
        name: 'AYUSH Terminology Service',
        telecom: [{
          system: 'email',
          value: 'terminology@ayush.gov.in'
        }]
      }],
      description,
      jurisdiction: [{
        coding: [{
          system: 'urn:iso:std:iso:3166',
          code: 'IN',
          display: 'India'
        }]
      }],
      caseSensitive: true,
      valueSet: url.replace('/CodeSystem/', '/ValueSet/'),
      hierarchyMeaning: 'is-a',
      compositional: false,
      versionNeeded: false,
      content: 'complete',
      count: concepts.length,
      concept: concepts.map(concept => ({
        code: concept.code,
        display: concept.display,
        definition: concept.definition,
        ...(concept.designation && { designation: concept.designation }),
        ...(concept.property && { property: concept.property })
      }))
    };
  }

  static createConceptMap(id, url, name, title, sourceUri, targetUri, groups = []) {
    return {
      resourceType: 'ConceptMap',
      id,
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/ConceptMap']
      },
      url,
      identifier: [{
        use: 'official',
        system: 'http://terminology.ayush.gov.in/identifier',
        value: id
      }],
      version: '1.0.0',
      name,
      title,
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      contact: [{
        name: 'AYUSH Terminology Service',
        telecom: [{
          system: 'email',
          value: 'terminology@ayush.gov.in'
        }]
      }],
      jurisdiction: [{
        coding: [{
          system: 'urn:iso:std:iso:3166',
          code: 'IN',
          display: 'India'
        }]
      }],
      sourceUri,
      targetUri,
      group: groups.map(group => ({
        source: group.source,
        sourceVersion: group.sourceVersion,
        target: group.target,
        targetVersion: group.targetVersion,
        element: group.elements.map(element => ({
          code: element.code,
          display: element.display,
          target: element.targets.map(target => ({
            code: target.code,
            display: target.display,
            equivalence: target.equivalence,
            ...(target.comment && { comment: target.comment }),
            ...(target.dependsOn && { dependsOn: target.dependsOn }),
            ...(target.product && { product: target.product })
          }))
        }))
      }))
    };
  }

  static createValueSet(id, url, name, title, description, compose = null) {
    return {
      resourceType: 'ValueSet',
      id,
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/ValueSet']
      },
      url,
      identifier: [{
        use: 'official',
        system: 'http://terminology.ayush.gov.in/identifier',
        value: id
      }],
      version: '1.0.0',
      name,
      title,
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      contact: [{
        name: 'AYUSH Terminology Service',
        telecom: [{
          system: 'email',
          value: 'terminology@ayush.gov.in'
        }]
      }],
      description,
      jurisdiction: [{
        coding: [{
          system: 'urn:iso:std:iso:3166',
          code: 'IN',
          display: 'India'
        }]
      }],
      immutable: false,
      ...(compose && { compose })
    };
  }

  static createBundle(type, entries = []) {
    return {
      resourceType: 'Bundle',
      id: uuidv4(),
      meta: {
        lastUpdated: new Date().toISOString()
      },
      type,
      total: entries.length,
      entry: entries.map(entry => ({
        fullUrl: entry.fullUrl,
        resource: entry.resource,
        ...(entry.request && { request: entry.request }),
        ...(entry.response && { response: entry.response }),
        ...(entry.search && { search: entry.search })
      }))
    };
  }

  static createParameters(parameters = []) {
    return {
      resourceType: 'Parameters',
      id: uuidv4(),
      meta: {
        lastUpdated: new Date().toISOString()
      },
      parameter: parameters.map(param => ({
        name: param.name,
        ...(param.valueString && { valueString: param.valueString }),
        ...(param.valueBoolean && { valueBoolean: param.valueBoolean }),
        ...(param.valueInteger && { valueInteger: param.valueInteger }),
        ...(param.valueCode && { valueCode: param.valueCode }),
        ...(param.valueCoding && { valueCoding: param.valueCoding }),
        ...(param.valueUri && { valueUri: param.valueUri }),
        ...(param.resource && { resource: param.resource }),
        ...(param.part && { part: param.part })
      }))
    };
  }
}