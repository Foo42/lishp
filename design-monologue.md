# Design Monologue
(Notes to help me reason out design choices. May as well commit it as a log of thinking)

## Function Argument Evaluation
Should we eval arguments before passing them into a func, or allow func to do that? Difference between a macro and a func?
Don't want to inadvertantly pass more than required.

Could choose to eval arguments (ie trad function behaviour) but with variety of semantics for keys
Options:
1. pass key in as it - leave it to the func body to retrieve values (using some passed in retrieve func or a global)
2. retrieve simple value, ie would return first level of mdags
3. retrieve as mdag with full depth (only advantage of this is reduced need to provide a retriever to func body)
4. Syntax to support the above
a) >somekey to retrieve key value, >>somekey to retrieve full depth, >3>somekey to retrieve a chosen depth

There is an advantage to having consistent behaviour since functions are not complicated by all having to decide what to do with the inputs.

On the other hand, if we end up distributing evaluation of an expression tree, want to ensure that 'evaluating' a `>key` term does not execute remotely.

## Labels:
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



* No prefix - assume literal
* `>` - treat as address, either fetch value (how deep?) and pass into functions by value, or pass as is (pass by reference)
* `$` - treat as label, pre-evaluate to address last bound to, ie >abc123
* 

## Passing things into functions
### Types of functions
* Built in operations
* User code stored in cas
* external functionality

### Things going into functions
* Literal values
* Subexpressions
* addresses
* mdag addresses
* labels to values
* labels to expressions (ie generated labels)

### Considerations
* Reducing work each function needs to implement
* Simplicity for functions, the less special cases the better
* Network performance, not passing large structures around when avoidable
* Avoiding waste (eg a function checking for item in a list can do so purely with addresses, doesn't need values retrieving)
* Cacheability
* Roundtrip reduction 

### Approaches
#### Always addresses
Features:
* addresses passed in as is
* literals stored and passed in as addresses
* subexpressions evaluated and results stored and passed in as addresses
* mdags passed in as address with no special treatment

Consequences:
* Pro: Functions do not need to distinguish between literals, subexpressions or stored values. Functions need to know they are recieving an mdag to deal with it correctly.
* Con: values of subexpressions need to be stored and available when function evaluation occurs. If we store in cache, we need to take care when we invalidate them and functions need to distinguish between retrieving values from expression cache or store. (could mitigate this last point using layered read-cas which attempts to read from underlying storage of cache using value hash before going to other CAS layers). Cache invalidation is even more complex when we imagine expressions being evaluated across a cluster of evaluators, how does the cache know when a parameter value is no longer being used. To complicate things even further, functions are free to return values which incorporate the addresses of their inputs (imagine an add to list function) in which case the cacheability of the output is invisibly dependent on the input being cached.

#### Ephemerals as values
* addresses passed in as is
* literals passed in as values (storing literals and passing address would probably work to tbh, wont be that many)
* subexpressions evaluated and passed in as values.

Consequences:
* Pro: Caching not complicated
* Con: May end up passing large values around
* If subexpression result is cached, we still have to retrieve the value in order to pass it to a another function, cant take advantage of just passing some reference like we would a stored value.

#### Function decides
Have some way that a function can express how it would like its arguments. For example `&foo` would could be asking for a parameter to be passed as a (potentially ephemeral) reference (similar to c++). As with C++ there would be an expectation (potentially enforced) to stop passing an ephemeral reference out as part of a return value.

## Binding Generators:
What is the relationship between evaluating expressions and binding generators?
The a binding generator is essentially a function (a macro?) which takes an expression and generates a new expression from it with labels dereferenced to the key they are bound to
