/* ------------
	cpuScheduler.js
	                             _              _       _
	  ___ _ __  _   _   ___  ___| |__   ___  __| |_   _| | ___ _ __
	 / __| '_ \| | | | / __|/ __| '_ \ / _ \/ _` | | | | |/ _ \ '__|
	| (__| |_) | |_| | \__ \ (__| | | |  __/ (_| | |_| | |  __/ |
	 \___| .__/ \__,_| |___/\___|_| |_|\___|\__,_|\__,_|_|\___|_|
	     |_|

------------ */

function CpuScheduler() {
	this.schedulingOptions = ['rr', 'fcfs']
	this.scheduler = this.schedulingOptions[0];
};

CpuScheduler.prototype.start = function() {
	if (_ReadyQueue.getSize() > 0) {
		// Set mode bit to user mode
		_Mode = 1;
		_CurrentProgram = _ReadyQueue.dequeue();
		// This program is now in the running state
		_CurrentProgram.state = ProcessState.RUNNING;
		// Initialize the CPU and set isExecuting to true only if
		// step is not currently enabled.
		var shouldBeExecuting = !_StepEnabled;
		_CPU.init(_CurrentProgram, shouldBeExecuting);
	}
};

CpuScheduler.prototype.determineNeedToContextSwitch = function() {
	if (this.scheduler === this.schedulingOptions[0]) {
		// In the case of Round Robin, we will only context switch if the
		// curent cycle count is >= the quantum
		if (_CycleCounter >= QUANTUM) {
			return true;
		}
	} else if (this.scheduler === this.schedulingOptions[1]) {
		// In the case of FCFS, we will context switch once the currently
		// running program has a state of terminated
		if (_CurrentProgram.state === ProcessState.TERMINATED) {
			return true;
		}
	}
	// If no conditions are met, then we don't need to context switch!
	return false;
}

// Does the switch between active processes
CpuScheduler.prototype.contextSwitch = function() {
	// Check to see that there is another process in the ready queue
	var nextProcess = _ReadyQueue.dequeue();
	if (nextProcess !== null) {
		if (this.scheduler === this.schedulingOptions[0]) {
			this.handleRoundRobinContextSwitch(nextProcess);
		} else if (this.scheduler === this.schedulingOptions[1]) {
			this.handleFCFSContextSwitch(nextProcess);
		} else {
			// This should never happen since we define what our scheduler types are
			// but we need to keep Murphy's Law in mind at all times.
			krnTrace("Unknown CPU scheduler, u wot m8?");
		}
	} else if (_CurrentProgram.state === ProcessState.TERMINATED) {
		this.stop();
	}
	// Reset the cycle counter
	_CycleCounter = 0;
};

CpuScheduler.prototype.handleRoundRobinContextSwitch = function(nextProcess) {
	krnTrace("Current cycle count > quantum of " + QUANTUM + ". Switching context.");
	// Update the PCB for the currently executing program
	_CurrentProgram.pcb.pc = _CPU.PC;
	_CurrentProgram.pcb.acc = _CPU.Acc;
	_CurrentProgram.pcb.xReg = _CPU.Xreg;
	_CurrentProgram.pcb.yReg = _CPU.Yreg;
	_CurrentProgram.pcb.zFlag = _CPU.Zflag;
	// If the currently executing program has a state of terminated,
	// do not put it back on the queue
	if (_CurrentProgram.state !== ProcessState.TERMINATED) {
		// Process will be moved back into the queue, so set its state to waiting
		_CurrentProgram.state = ProcessState.WAITING;
		// Put the ProcessState back on the ready queue
		_ReadyQueue.enqueue(_CurrentProgram);
	}
	// Update the display
	_CurrentProgram.printToScreen();
	// Set the CurrentProgram to the next process
	_CurrentProgram = nextProcess;
	// This program is now in the running state
	_CurrentProgram.state = ProcessState.RUNNING;
	// Initialize the CPU and set isExecuting to true only if
	// step is not currently enabled.
	var shouldBeExecuting = !_StepEnabled;
	_CPU.init(_CurrentProgram, shouldBeExecuting);
};

CpuScheduler.prototype.handleFCFSContextSwitch = function(nextProcess) {
	// FCFS is basically Round Robin anyway! Yay for code-reuse!
	this.handleRoundRobinContextSwitch(nextProcess);
};

CpuScheduler.prototype.stop = function() {
	// If we do not need to switch processing to next program on ready queue,
	// we'll determine if the currently executing program has a state of terminated.
	// If so, we will halt the CPU as we know that there is nothing else on the
	// ready queue, and our running process is terminated.
	_CPU.isExecuting = false;
	// Set the mode bit back to kernel mode, as the user processes are over
	_Mode = 0;
	// Update the display
	_CurrentProgram.printToScreen();
	// Reset the current program
	_CurrentProgram = null;
	// Reset the cycle counter
	_CycleCounter = 0;
};
