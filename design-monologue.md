# Design Monologue
(Notes to help me reason out design choices. May as well commit it as a log of thinking)

Should we eval arguments before passing them into a func, or allow func to do that? Difference between a macro and a func?
Don't want to inadvertantly pass more than required.

Could choose to eval arguments (ie trad function behaviour) but with variety of semantics for keys
Options:
1. pass key in as it - leave it to the func body to retrieve values (using some passed in retrieve func or a global)
2. retrieve simple value, ie would return first level of mdags
3. retrieve as mdag with full depth (only advantage of this is reduced need to provide a retriever to func body)
4. Syntax to support the above
a) >somekey to retrieve key value, >>somekey to retrieve full depth, >3>somekey to retrieve a chosen depth

Labels:
Use cases:
1) Get current value
2) Get full history
3) Get some amount of history, ie current plus previous

All these operations lean on deferencing the label to it's current key. They then differ by how much of the linked-list they retrieve and what they do with it.

If we want to support labels with arbitrary punctuation and spaces we need them to be quoted strings in the expression, and thus need syntax to identify them. Unlike the value retrieve operator >, symbol substitution is not referentially transparent and thus must effectively be performed as a pre-processing before expression cache lookup. Strictly only the substitution of a label for the key of its history head is necessary to attain referential transparency, any helpers for getting current binding or history can be done as part of normal evaluation.

Need a way of doing a deep replace on symbols for their current values. Needs to handle quoted. Perhaps $'foo bar'. In some ways s-expression package helps with this as the previous example will parse to [$, [String, 'foo bar']], ie apply $ to the string. Thus we can do a pre-process in which we essentially only evaluate the $ function (which would perform a symbol lookup). Unfortunatly $foo will not parse to ['$', 'foo'] but rather '$foo' so we would need to handle both cases.


1) $foo = current binding of foo (ie key it is currently bound to)
	>$foo = value of key foo is currently bound to
2) perhaps $foo.. or $foo[]

Low syntax approach:
The approach with lowest syntax is to have a symbol which represents a label and use that to get the key of the head of the binding list, then use regular explicit functions to perform the common operation of getting current.

available symbols !@£#$%^&*_+{}[]|?<>.~
&symbol
$symbol

Macro approach:
Run expressions through an execute macro phase prior to execution, among which could be a macro to retrieve label current values and another to get the list key, perhaps '$' and 'history' respectively?

($ 'my symbol') or simply $'my symbol'
(history 'my symbol name')

If we implement 'history' as a macro, then we can have current value be the default behaviour since the 'history' macro will not be bound by default symbol substitution behaviour. Thus getting current value could be implicit

We can denote labels in expressions using the '$' symbol, ie (equal abc123 $someObject)
We could combine this with the syntax for retrieving values from the cas ie (add >abc123 >$someLabel)
We want to support getting the current value, but also accessing the list which represents the stream.
If we use the >> syntax for reassembling mdags, then we could use >>$label to retrieve the full linked list.

Binding Generators:
What is the relationship between evaluating expressions and binding generators?
The a binding generator is essentially a function (a macro?) which takes an expression and generates a new expression from it with labels dereferenced to the key they are bound to
