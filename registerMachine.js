/*
	TODO:
		-- figure out data structure for instructions
		-- sort out helper functions
		-- figure out assoc
		-- make error message function
*/

/* 
	input data structures for Machine 

		-- list of register names
			~ array
		-- list of pairs {opName : actualOp}
			~ dictionary
		-- controller instruction list
			~ array
				~ string? should we bring in
					a lisp parser?
			~ don't include word 'controller'
	
	example:

	(define gcd-machine
		(make-machine
			;; register names
			'(a b t) 
			;; opName / op pairs
			(list (list 'rem remainder)
					(list '= =))
			;; instruction list (string?)
			'(test-b
				(test (op =) (reg b) (const 0))
				(branch (label gcd-done))
				(assign t (op rem) (reg a) (reg b))
				(assign a (reg b))
				(assign b (reg t))
				(goto (label test-b))
			gcd-done)))
*/


/* machines */
function Machine(registers, operations, controllerText) {
	
	var counter = new Register('counter');
	var flag = new Register('flag');
	this.stack = new Stack(); // should this be private?
	var stack = this.stack;

	/* registers */
	// TODO: change this to a regular dictionary
	// can we make this take register.name
		// rather than the actual name string?
	 var registerTable =
		[
			{'counter' : counter},
			{'flag' : flag}
		];
	// TODO: change allocateRegister too
	// should this be public?
	var allocateRegister = 
		function(name) {
			if (assoc(name, registerTable)) // assoc???
				throw 'Multiply-defined register ' + name;
			else
				registerTable.unshift(name, new Register(name));

			return 'Register allocated!';
	};

	this.lookupRegister = 
		function(name) {
			if (assoc(name, registerTable)) // assoc???
				return ; // value of name in registerTable
			else
				throw 'Unknown register: ' + name;
	};

	registers.forEach(function(register) {
		allocateRegister(register);
	});

	/* operations */

	var basicOperations =
		[
			{ 'initialize-stack' : stack.initialize() }
		];
	// privatize these?
	this.operations = basicOperations.concat(operations);

	this.installOperations =
		function(ops) {
			this.operations.concat(ops);
	};

	/* instructions and controller */

	var basicInstructions = []; // needed?

	// should 'self' be used instead of 'this'?
	var instructions = assemble(controllerText, this);

	this.installInstructions =
		function(sequence) {
			instructions = sequence;
	};

	/* run */
	// ???
	 var execute = 
		function() {
			var instructions = getContents(counter);
			if (insts.length == 0)
				return 'done';
			else {
				instructionExecutionFunc(instructions[0]);
				execute(); // recursive method call???
			}
	};

	this.start =
		function() {
			setContents(counter, instructionSequence);
			execute(); //???
	}
}

function start(machine) {
	machine.start()
}

/* registers */

function Register(name) {
	this.name = name;

	var contents = '*unassigned*';
	
	// are these helper methods even needed?

	this.get = function() {
		return contents;
	}
	
	this.set = function(value) {
		contents = value;
	}
}

// are these helper functions really needed?
// OTOH, does the book require even more?

function getContents(register) {
	return register.get();
}

// register must be string (i.e. the register's name)
function getRegister(machine, registerName) {
	return machine.lookupRegister(register);
}

function setContents(register, value) {
	register.set(value);
}

function setRegister(machine, register, value) {
	
}

/* stacks */

function Stack() {
	
	//this.contents = [];

	var contents = [];
	
	this.push = function(x) {
		contents.unshift(x);
	}
	
	this.pop = function() {
		if (contents.length == 0)
			throw "Empty stack -- POP";
		else
			return contents.shift();
	}
	
	this.initialize = function() {
		contents = [];
		return 'initialized';
	}
}

function pop(stack) {
	return stack.pop();
}

function push(stack, value) {
	stack.push(value);
}


/* assembler, controller, instructions */

/*
	What kind of data structure does the book use
	for controller text and instructions?

	What would be the best kind for JS?

	Assume linked lists for now, using
	[0] for car and .slice(1) for cdr.
*/

/* lisp stuff */

var errorText = 'ASSEMBLE -- bad instruction : ';

function assemble(controllerText, machine) {
	var run = // better name?
		function(instructions, labels) {
			updateInstructions(instructions,
								labels, machine);
			return instructions;
		}

	return extractLabels(controllerText, run);
}

function extractLabels(text, receive) {
	if (text.length == 0)
		return receive([],[]);
	else {

	}
}

function updateInstructions(instructions, labels, machine) {
	var counter = getRegister('counter'); // ???
	var flag = getRegister('flag');
	var stack = machine.stack;
	var operations = machine.operations;

	instructions.forEach(function(instruction) {
		var executionFunc = 
			makeExecutionFunc(instructionText(instruction),
								labels, machine, counter,
								flag, stack, operations);

		setInstructionExecutionFunc(instruction,
										executionFunc);
	})
}

/* instructions */
// should these be grouped together, perhaps in an object?
function makeInstruction(text) {
	return [ text, [] ];
}

function instructionText(instruction) {
	return instruction[0];
}

function instructionExecutionFunc(instruction) {
	return instruction[1];
}

function setInstructionExecutionFunc(instruction, func) {
	instruction[1] = func;
}

function makeExecutionFunc(instruction, labels, machine,
							counter, flag, stack, operations) {

	var text = instructionText(instruction);

	if (text == 'assign')
		return makeAssign ( instruction, machine, labels,
							operations, counter );
	if (text == 'test')
		return makeTest ( instruction, machine, labels,
							operations, flag, counter );
	if (text == 'branch')
		return makeBranch ( instruction, machine, labels,
							flag, counter );
	if (text == 'goto')
		return makeGoto ( instruction, machine, 
							labels, counter );
	if (text == 'save')
		return makeSave ( instruction, machine, 
							stack, counter );
	if (text == 'restore')
		return makeRestore ( instruction, machine, 
								stack, counter );
	if (text == 'perform')
		return makePerform ( instruction, machine, labels,
								operations, counter );
	else
		throw 'Unknown instruction type' 
					+ ' -- ASSEMBLE : ' + text;
}

/* execution functions */

// cdr down the counter list
function advanceCounter(counter) {
	setContents(counter, getContents(counter).slice(1));
}

// assign
function makeAssign(instruction, machine, labels, 
							operations, counter) {

	var target = getRegister(machine, assignRegName(instruction));
	var valueExp = assignValueExp(instruction);

	var valueFunc =
		operationExp(valueExp) ? 
			makeOperationExp(valueExp, machine, labels, operations) :
			makePrimitiveExp(valueExp[0], machine, labels);

	return function() {
		setContents(target, valueFunc);
		advanceCounter(counter);
	};
}

// assign helpers
function assignRegName(assignInstruction) {
	return assignInstruction.slice(1)[0];
}

function assignValueExp(assignInstruction) {
	return assignInstruction.slice(1).slice(1);
}

// test
function makeTest(instruction, machine, labels,
					operations, flag, counter) {

	var condition = testCondition(instruction);

	if (!operationExp(condition))
		throw errorText + instruction;

	var conditionFunc =
		makeOperationExp(condition, machine,
							labels, operations);

	return function() {
		setContents(flag, conditionFunc);
		advanceCounter(counter);
	};
}

// test helper
function testCondition(testInstruction) {
	return testInstruction.slice(1);
}


// branch
function makeBranch(instruction, machine, labels,
						flag, counter) {

	var destination = branchDestination(instruction);

	if (!labelExp(destination))
		throw errorText + instruction;

	var instructions =
		lookupLabel(labels, 
					labelExpLabel(destination));

	return function() {
		if (getContents(flag)) { // flag should be holding boolean?
			setContents(counter, instructions);
			advanceCounter(counter);
		};
	}
}

// branch helper
function branchDestination(branchInstrunction) {
	return branchInstrunction.slice(1)[0];
}


// goto
function makeGoto(instruction, machine, labels, counter) {

	var destination = gotoDestination(instruction);

	if (labelExp(destination)) {
		var instructions = 
			lookupLabel(labels, labelExpLabel(destination));
		return function() {
			setContents(counter, instructions);
		};
	}

	else if (registerExp(destination)) {
		var register =
			getRegister(machine, registerExpRegister(destination));
		return function() {
			setContents(counter, getContents(register));
		};
	}

	else throw errorText + instruction;
}

// goto helper
function gotoDestination(gotoInstruction) {
	return gotoInstruction.slice(1)[0];
}

// save
function makeSave(instruction, machine, stack, counter) {
	var register =
		getRegister(machine, stackInstRegName(instruction));

	return function() {
		push(stack, getContents(register));
		advanceCounter(counter);
	};
}

// restore
function makeRestore(instruction, machine, stack, counter) {
	var register =
		getRegister(machine, stackInstRegName(instruction));

	return function() {
		setContents(register, pop(stack));
		advanceCounter(counter);
	};
}

// save and restore helper
function stackInstRegName(stackInstruction) {
	return stackInstruction.slice(1)[0];
}


// perform
function makePerform(instruction, machine, labels, 
						operations, counter) {

	var action = performAction(instruction);

	if (!operationExp(action))
		throw errorText + instruction;

	var actionFunc =
		makeOperationExp(action, machine, labels, operations);

	return function() {
		actionFunc();
		advanceCounter(counter);
	};
}

// perform helper
function performAction(instruction) {
	return instruction.slice(1);
}


/* expressions */

// primitives
function makePrimitiveExp(exp, machine, labels) {
	if (constantExp(exp)) {
		var constant = constantExpValue(exp);
		return function() {
			return constant;
		};
	}

	else if (labelExp(exp)) {
		var instructions =
			lookupLabel(labels, labelExpLabel(exp));
		return function() {
			return instructions;
		};
	}

	else if (registerExp(exp)) {
		var register =
			getRegister(machine, registerExpReg(exp));
		return function() {
			return getContents(register);
		};
	}

	else throw 'ASSEMBLE -- Unknown expression type : ' + exp;
}

// primitive helpers (and others)
function tag(exp) {
	return exp[0];
}

function registerExp(exp) {
	return tag(exp) == 'reg';
}

function registerExpReg(exp) {
	return exp.slice(1)[0];
}

function constantExp(exp) {
	return tag(exp) == 'const';
}

function constantExpValue(exp) {
	return exp.slice(1)[0];
}

function labelExp(exp) {
	return tag(exp) == 'label';
}

function labelExpLabel(exp) {
	return exp.slice(1)[0];
}


// operations
// ???
function makeOperationExp(exp, machine, labels, operations) {
	var operation =
		lookupPrimitive(operationExpOp(exp), operations);
	var aFuncs = // what is 'a'? what is 'e'?
		(operationExpOperands(exp)).forEach(function(e) {
			makePrimitiveExp(e, machine, labels);
		});
	return function() {
		// ???
	};
}

// operation helpers
function lookupPrimitive(symbol, operations) {
	var val = assoc(symbol, operations);
	if (val)
		return val.slice(1)[0]; // lazy
	else
		throw 'ASSEMBLE -- Unknown operation : ' + symbol;
}

function operationExp(exp) {
	return exp[0] == 'op'; // and pair?
}

function operationExpOp(operationExp) {
	return operationExp[0].slice(1)[0];
}

function operationExpOperands(operationExp) {
	return operationExp.slice(1);
}


/* labels */

function makeLabelEntry(labelName, instructions) {
	instructions.unshift(labelName); // right data structure?
}

function lookupLabel(labels, labelName) {
	var val = assoc(labelName, labels);
	if (val) // val is boolean?
		return val.slice(1);
	else
		throw 'ASSEMBLE -- undefined label : ' + labelName;
}




















