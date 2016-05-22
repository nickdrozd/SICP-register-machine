

/*
	example (from book):

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

	Maybe write the machine code directly in JS?


	machineData is an array consisting of
		> an array of register names,
		> an array of input register names
			(a subset of register names)
		> a designated return register name
			(maybe make that standard?)
		> a dictionary of operation names
			paired with actual functions,
			and
		> the controller text.

	The controller text is in string form
	(written in Lisp style), and it will
	get parsed into JS array format before
	getting passed to the assembler.
*/

// TODO: designate start and return registers

function Machine(machineData) {
	var counter = new Register('counter');
	var flag = new Register('flag');
	var stack = new Stack();

	/* registers */

	var registerNames = machineData[0];
	var inputRegisters = machineData[1];
	var outputRegister = machineData[2];

	var registerTable = 
		{
			'counter' : counter,
			'flag' : flag,
		};

	this.lookupRegister(name) {
		if (name in registerTable) 
			return registerTable.name;
		else
			throw 'Unknown register: ' + name;
	}

	function allocateRegister(name) {
		if (name in registerTable)
			throw name + ' already defined!';
		else
			registerTable[name] = new Register(name);
	}

	// on creation
	registerNames.forEach(function(name) {
		allocateRegister(name);
	});

	this.setInputs(inputs) {
		for (i = 0; i < inputs.length; i++)
			inputRegisters[i].set(inputs[i]);
	}

	this.output = outputRegister.contents();

	/* operations */
	// TODO: sort this out

	var operations = machineData[3];

	// more basic ops can be added later
	var basicOperations = 
		{
			'initializeStack' : 
			function() {stack.initialize();},
		};

	// on creation
	for (opName in basicOperations)
		operations[opName] = basicOperations[opName];

	// install operations?


	/* instructions */

	/*
		major instruction manipulation functions
		defined outside of machine:
			~ parse
			~ assemble
	*/

	var controllerText = machineData[4];
	var parsedtext = parse(controllerText);
	var assembledText = assemble(parsedText);
	var instructions = assembledText[0];
	var labels = assembledText[1];

	function updateInstructions() {
		instructions.forEach(function(instruction) {
			var text = instruction.text;
			var executionFunc = 
				makeFunc(text);

			instruction.setFunc(executionFunc);
		});
	}

	function makeFunc(instruction) {
		var type = instruction.type;

		if (type == 'assign')
			return makeAssign(instruction);
		if (type == 'test')
			return makeTest(instruction);
		if (type == 'branch')
			return makeBranch(instruction);
		if (type == 'goto')
			return makeGoto(instruction);
		if (type == 'save')
			return makeSave(instruction);
		if (type == 'restore')
			return makeRestore(instruction);
		if (text == 'perform')
			return makePerform(instruction);
		else
			throw 'Unknown instruction type' 
						+ ' -- ASSEMBLE : ' + type;
	}

	function makeAssign(instruction) {

	}

	function makeTest(instruction) {

	}

	function makeBranch(instruction) {

	}

	function makeGoto(instruction) {

	}

	function makeSave(instruction) {
		var stackInstRegName = instruction[1];
		var register =
			this.lookupRegister(stackInstRegName);
		return function() {
			stack.pushIt(register.contents());
		};
	}

	function makeRestore(instruction) {
		var stackInstRegName = instruction[1];
		var register =
			this.lookupRegister(stackInstRegName);
		return function() {
			registers.set(stack.popIt());
		}
	}

	function makePerform(instruction) {

	}







	function advanceCounter() {
		counter.set(counter.contents().slice(1))
	}


	/* run */

	/* 
		Question: why do we put advanceCounter in the
		individual instructions, rather than in execute?
	*/
	function execute() {
		var docket = counter.contents();
		if (docket.length == 0)
			return 'done!';

		var instruction = docket[0];
		instruction.executeFunc();
		execute();
	}

	// private?
	this.start = function() {
		counter.set(instructions);
		execute();
	}

	// inputs should be an array
	// # of inputs should equal # of start regs
	this.run = function(inputs) {
		this.setInputs(inputs);
		this.start();
		return this.output;
	}
}



/* registers */

function Register(name) {
	 var contents = '*unassigned*';

	 this.contents = function() {
	 	return contents;
	 }

	 this.set = function(value) {
	 	contents = value;
	 }
}

/* stacks */

function Stack() {
	var contents = [];

	this.pushIt = function(value) {
		contents.unshift(value);
		return 'push it! push it good!';
	}

	this.popIt = function() {
		if (contents.length == 1)
			throw "Empty stack -- POP";
		else
			return contents.shift();
	}

	this.initialize() {
		contents = [];
		return 'initialized!';
	}
}

/* instructions */

function Instruction(text) {
	/* not actual text, since the controller-text
		will alreay have been parsed */
	this.text = text;

	this.type = text[0];

	var func = function(){};

	this.setFunc = function(func) {
		func = func;
	};

	this.executeFunc() = function() {
		func();
	}
}

function assemble(text) {
	if (text.length == 0)
		return [ [], [] ];

	// will this recursion be a problem?
	var result = assemble(text.slice(1));
	var instructions = result[0];
	var labels = result[1];
	var nextInstruction = text[0];

	// nextInstruction is a label
	if (typeof(nextInstruction) == 'string') {
		var entry = [nextInstruction, instructions];
		labels.unshift(entry);
		return [instructions, labels];
	}

	// nextInstruction is an instruction
	else {
		var instruction = 
			new Instruction(nextInstruction);
		instructions.unshift(instruction);
		return [instructions, labels];
	}
}









/* expression types */














// functional interface

function pop(stack) {
	return stack.popIt();
}

function push(stack, value) {
	stack.pushIt(value);
}

function getContents(register) {
	return register.contents();
}

function setContents(register, value) {
	register.set(value);
}

function getRegister(machine, registerName) {
	var register = machine.lookupRegister(registerName);
	return getContents(register);
}

function setRegister(machine, registerName, value) {
	var register = machine.lookupRegister(registerName);
	setContents(register, value);
}

function startMachine(machine) {
	machine.start();
}






















