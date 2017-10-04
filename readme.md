## Content Addressable Spaces (CAS)
A content-addressable space is place we can read and write data with the address of that data being derived in a predictable way from the content of that data. A common implementation is to produce a hash such as SHA256 of the data, and then to use that as a key in either an in-memory map, or as part of a url in a system such as S3.

CAS have several useful properties. Firstly, since the address of a piece of data is tied to its content, the same address will always point the same value, thus anything holding an address of some data can essentially treat it as immutable. As a direct result of this, it becomes very easy to cache values against their key as we never have to worry about cache invalidation. Likewise we can reference the same data from multiple places for multiple purposes without worrying it will be changed, allowing for very efficient storage.

## Referentially Transparent Functions (RTFs)
When we think of mathematical expressions such a `2+2` we are comfortable with the idea that the answer is fixed - we will get the same answer today as tomorrow. The reason for this is that the "answer is in the question" so to speak - there is nothing that influences the answer other than the information in the question, namely the values `2` and `2` and the operation performed on them `sum`. This is true of both simple expressions such as in our example, or more complex mathematical functions such as `tanh(pi)^2`. Such expressions or functions are said to referentially transparent as there are no hidden references in the calculation of the result. As a direct consequence of this, we can capture the result of a calculation and then reuse it whenever we have the same calculation in future without fear the correct answer will have changed.

By contrast many functions in imperative programming environments tend not to behave like this. We can think of examples such as `getCurrentTime()`, `Math.random()` or `File.read(somefile.txt)` which can return different answers each time they are called as they essentially have 'hidden' inputs such as the system clock or the current state of the file system. Likewise any functions which internally use any of these functions inherit the same characteristic. These functions are said to be referentially opaque.

It is usually unavoidable that practical computer applications of any complexity have a need for ingesting external data via functions of this nature. This often causes the application as a whole to have referential opacity. If care is taken however to segment the application into initial referentially opaque operations (such as finding the current date or loading data from file), and a subsequent portion in which all functions behave with referential transparency acting only on the given data, then we can get the benefits of referentially transparency over the maximum portion of the system.

## Combining CAS and RTFs
RTFs and CAS are natural collaborators. Since data are immutably addressed in a CAS, then not only does a key `k1` point to a single immutable value, but likewise an RTF `f` applied to `k1` `f(k1)` has a single immutable answer. Thus we can safely calculate and cache the answer against the input expression (or a hash derived from it) in an expression-value space (EVS).

We can imagine a system then in which all input values are stored in a CAS, and RTFs (also stored in the CAS) are applied to them yielding values stored in an EVS such that actual evaluation is only performed once, and all subsequent queries return the previously calculated value.

## Binding Names to values
While the immutable connection between a piece of data's address and it's content has many useful benefits, many systems also benefit from a way to model concepts whose value changes over time. For example the notion of the "latest report". We can facilitate this without weakening the guarantees of a CAS by maintaining a separate table of "bindings" which relate a label (such as "latest report") to the key of a value in the CAS. These bindings are mutable, they can be updated to point to different values in the CAS over time, whilst the actual values in the CAS never change. For example a report of some kind may be generated on a Monday and stored in the CAS. Initially the label "latest report" would be bound to the address of this report. Then on Tuesday, a new report may be generated and stored, at which point the "latest report" label could be rebound to the address of this report. Whilst the Monday report would still exist unchanged at its original address, the "current report" label would no longer resolve to it.

Since a label can be bound to different values over time, in some ways it acts as a stream of values, with a current value and history of previous values. If we capture this history as we rebind labels, then we can make historic values of bindings available to query and use. One way to do this would be to record (re)bindings in an append-only log structure. Another would be to store bindings in a linked list structure, such that the current head contains both the address of the current bound value, and the address of the previous element. While both of these options provide some ability to "rewind" and inspect the system at a previous point in time, a linked list approach has the benefit that the timeline of a binding is essentially made up from stored, addressable elements, such that we in effect can hold a pointer to any point in time.

## Applying Functions to labels
When we considered applying RTFs to values, we noted that there was an immutable connection between the expression `f(k)` and it's result, since neither the function `f`, nor the value referred to by `k` could change.

By contrast, if we consider the expression `f(l)` in which the function `f` is applied to the label `l` we can see that the result depends on the value `l` is bound to at the time the expression is evaluated. Rather than having a single immutable value, we find the expression `f(l)` in fact has a single value for each value of `l`.

We can model this behavior by introducing a new way of binding a label, in which we supply not a concrete value, but an expression by which values are generated. These "generated bindings" would automatically be rebound to new values each time a label referenced in their "binding expression" was rebound.

For example, given:

* An RTF `f`
* A CAS storing 2 values with keys `k1`, `k2`
* A label `l` initially bound to `k1`
* A generated binding which binds the label `g` via the expression `f(l)`

At time 0, the value bound to `g` would be `f(k1)` which is a concrete expression with a single immutable result.

If at time 1, the label `l` were manually rebound to `k2`, then the label `g` would automatically be rebound according to the new value of it's binding expression and would point to `f(k2)`.

In such a system, just as manual label bindings can be thought of as streams of raw values, so to generated bindings can be thought of as projections of those streams through functions.

An interesting property of such an approach is that the actual values of such generated streams can be calculated lazily, so long as the binding is updated by the system to point to the concrete expression defined by the current values of all referenced labels, eg `f(k1)` then there is no imperative to calculate the actual result of that expression until it is needed, since the expression `f(k1)` is referentially transparent and will have the same value whenever calculated.

## Composition of Generated bindings

In the examples given above, we looked at expressions in which a function `f` was applied to a single input, however the approach laid out is easily extended to functions of higher arity. Given a function `difference` with an arity of 2, we could bind a label 'profit' with the expression `difference(revenue, costs)` to define a generated binding which would be updated when either the `revenue` or `costs` labels were rebound.

A further form of composition can be achieved by recognising that generated bindings can themselves be referenced in the definition of other generated bindings. To continue our example, given a rounding function `round`, we could bind a label `rounded_profit` to the expression `round(profit)`.

## todo
* Modelling sets
  * perhaps with expressions along lines of `(union, some_set, ["new value"])`
* Reduce functions
  * `f(ln, f(ln-1, ...))`
  * Do we need to change the way the bind from expression generates the expression elements? Currently there is a direct relationship that the element of a generated binding is created by substituting the labels for their bound values. Is there a more generic approach that almost allows us to template the expression? I think we need this for reduce and filters maybe?
  * Maybe do not need complexity. how about `bindFrom('n',(apply, f, n, m))` in which n has value of f applied to previous value (ie accumulator) and m, ie target collection
