QUnit.test("Test computeMissingFieldWarning()", function (assert) {

    warnings.expectedFields = {book: ['title', 'author'], article: ['title']};

    assert.equal(warnings.computeMissingFieldWarning().length, 0, 'missing argument returns empty list');

    assert.equal(warnings.computeMissingFieldWarning().length, 0, 'empty entry returns empty list');

    assert.equal(warnings.computeMissingFieldWarning({id: 'a'}).length, 0, 'entry without type returns empty list');

    assert.equal(warnings.computeMissingFieldWarning({
        id: 'a',
        type: 'a'
    }).length, 0, 'typed entry without further fields returns empty list');

    assert.ok(warnings.computeMissingFieldWarning({
            id: 'a',
            type: 'book'
        }).length == 2, 'book entry without further fields returns two warnings (see expected fields)');

    assert.ok(warnings.computeMissingFieldWarning({
            type: 'article'
        }).length == 1, 'article entry without further fields returns one warning (see expected fields)');

    assert.ok(warnings.computeMissingFieldWarning({
            type: 'article',
            title: 'abc'
        }).length == 0, 'article entry with title returns no warnings (see expected fields)');

    assert.ok(warnings.computeMissingFieldWarning({
            type: 'article',
            title: ''
        }).length == 0, 'article entry with empty title returns no warnings (see expected fields)');

    assert.ok(warnings.computeMissingFieldWarning({
            type: 'article',
            bla: 'abc'
        })[0]['type'].indexOf('title') > 0, 'article without title returns one warning containing the word "title" (see expected fields)');

    assert.ok(warnings.computeMissingFieldWarning({
            type: 'article'
        })[0]['fix']['description'] != null, 'article entry without further fields returns one fix with description (see expected fields)');

    assert.ok(warnings.computeMissingFieldWarning({
            type: 'article'
        })[0]['fix']['function']() != null, 'article entry without further fields returns one fix with a executable function (see expected fields)');

    var fixedEntry = warnings.computeMissingFieldWarning({
        type: 'article'
    })[0]['fix']['function']();
    assert.ok(fixedEntry['title'] === '', 'article entry without further fields returns one fix that, when applied, adds a new empty field (see expected fields)');
    assert.ok(fixedEntry['type'] === 'article', 'article entry without further fields returns one fix that, when applied, keeps the type (see expected fields)');

});

QUnit.test("Test computeTitleCapitalizationWarning()", function (assert) {

    assert.equal(warnings.computeTitleCapitalizationWarning().length, 0, 'missing argument returns empty list');

    assert.equal(warnings.computeTitleCapitalizationWarning().length, 0, 'empty entry returns empty list');

    assert.equal(warnings.computeTitleCapitalizationWarning({id: 'a'}).length, 0, 'entry without type returns empty list');

    assert.equal(warnings.computeTitleCapitalizationWarning({
        id: 'a',
        type: 'a'
    }).length, 0, 'typed entry without further fields returns empty list');

    assert.equal(warnings.computeTitleCapitalizationWarning({
        journal: 'Bla in a Longword',
        booktitle: 'Blub in the Whole World'
    }).length, 0, 'correctly capitalized journal and booktitle field returns empty list');

    assert.equal(warnings.computeTitleCapitalizationWarning({
        booktitle: '5th Blub in the Whole World'
    }).length, 0, 'correctly capitalized booktitle field starting with a number returns empty list');

    assert.equal(warnings.computeTitleCapitalizationWarning({
        journal: 'bla in a Longword',
        booktitle: 'Blub in the Whole world'
    }).length, 2, 'incorrectly capitalized journal and booktitle field returns two wranings');

    var fixedEntry = warnings.computeTitleCapitalizationWarning({
        journal: 'bla in a longword'
    })[0]['fix']['function']();
    assert.equal(fixedEntry['journal'], 'Bla in a Longword', 'incorrectly capitalized journal returns a fix that, when applied, capitalizes the first word and a long word');

});

QUnit.test("Test computeProtectedIdentifierCapitalizationWarning()", function (assert) {

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning().length, 0, 'missing argument returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning().length, 0, 'empty entry returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({id: 'a'}).length, 0, 'entry without type returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({
        id: 'a',
        type: 'a'
    }).length, 0, 'typed entry without further fields returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'Bla in a Name'
    }).length, 0, 'non-camel-case title field returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'Bla in a Special-Name'
    }).length, 0, 'hyphenated capitalized word in title field returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'Bla in a Name/Identifier'
    }).length, 0, 'capitalized word with slash in title field returns empty list');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'Bla in a {SpecialName}'
    }).length, 0, 'protected camel-case identifier in field title returns no warning');

    assert.equal(warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'Bla in a SpecialName'
    }).length, 1, 'non-protected camel-case identifier in field title returns one warning');

    var fixedEntry = warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'BlaBlubb in a SpecialName'
    })[0]['fix']['function']();
    assert.equal(fixedEntry['title'], '{BlaBlubb} in a {SpecialName}', 'non-protected camel-case identifiers in field title returns a fix that, when applied, protects the identifiers');

    fixedEntry = warnings.computeProtectedIdentifierCapitalizationWarning({
        title: 'SpecialName in a SpecialName'
    })[0]['fix']['function']();
    assert.equal(fixedEntry['title'], '{SpecialName} in a {SpecialName}', 'non-protected camel-case identifiers (two times the same one) in field title returns a fix that, when applied, protects the identifiers');


});


