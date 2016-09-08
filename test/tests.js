QUnit.test("Test computeMissingFieldWarning()", function (assert) {
    warnings.expectedFields = {book: ['title', 'author'], article: ['title']};

    assert.equal(0, warnings.computeMissingFieldWarning().length, 'missing argument returns empty list');
    assert.equal(0, warnings.computeMissingFieldWarning().length, 'empty entry returns empty list');
    assert.equal(0, warnings.computeMissingFieldWarning({id: 'a'}).length, 'entry without type returns empty list');
    assert.equal(0, warnings.computeMissingFieldWarning({
        id: 'a',
        type: 'a'
    }).length, 'typed entry without further fields returns empty list');
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

