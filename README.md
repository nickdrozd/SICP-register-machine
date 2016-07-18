# SICP-register-machine
A translation into JavaScript of the register machine simulator presented in SICP chap 5.

In chapter 5 of the book Structure and Interpretation of Computer Programs, a toy assembly language is developed to show how programs can be implemented at the primitive machine level. In section 5.2, a Scheme program is presented that takes as input code written in this toy assembly language and then simulates the behavior of a register machine running that same code. It "simulates" such a machine in the sense that it performs (at some level) the same steps that the machine would perform. This simulator, then, is in effect an interpreter for the toy assembly language, but a very particular kind of interpreter.

Anyhow, this register machine simulator program is a "translation" of SICP's Scheme program into JavaScript. The essentials of the program have all been left intact. Some parts were translated more or less literally, but other parts have been adapted to more idiomatic JS. For a trivial example, Scheme's (cadr s), ie (car (cdr s)), ie the first element of the list of all the elements of s but the first, would be literally translated as s.slice(1)[0]. However, the idiomatic way of putting this in JS (and most languages, in fact) would simply be s[1]. For another example (still not of much consequence), SICP implements object methods by a funny style where to call an object method, a string literal is passed as an argument to the object. Instances of this style of object have been converted to JS dot notation.

A more substantial change was made in the organization of functions. SICP style favors a profusion of small, free-standing functions which call each other. An example is the function make-execution-procedure, which takes seven parameters: an instruction, labels, machine, program counter, flag, stack, and operations. The function dispatches on the type of the instruction, and then calls one of several other functions, each of which takes as parameters four or five of make-execution-procedure's parameters. In this simulator, those functions have all been grouped together as methods inside one gigantic Machine function. The difference (hopefully) comes down to a matter of taste: maybe you don't like gigantic single functions, and maybe you don't like a bunch of little functions all calling the same parameters over and over.

* Personal Reflection

At first glance, the task of "translating" a program from one language to another might seem like it wouldn't take much thought: just figure out a semantics-preserving transformation of expressions and then transform it accordingly. But when you decide to take some stylistic and organizational liberties, things are not so simple. The problem is that to change anything, you have to understand everything, otherwise you will have no way to telling what your change will do. And how well do you really understand someone else's program? To produce this JS program, I had to understand literally every single line of Abelson and Sussman's program. Handwaving is impossible. And the code does get a little obscure at points. The hardest part was the following function:

(define (make-operation-exp exp machine labels operations)
  (let ((op (lookup-prim (operation-exp-op exp) operations))
        (aprocs
          (map (lambda (e) (make-primitive-exp e machine labels))
                (operation-exp-operands exp))))
    (lambda ()
        (apply op (map (lambda (p) (p)) aprocs)))))
        
Can you figure out what that function does? It certainly took me a long time.

As a consequence of the stringent requirement of having to understand literally every single line of code, I learned a tremendous amount about programming -- in particular, program organization and delayed evaluation. I would highly recommend for any early-intermediate-level programmer to undertake a project like this.
