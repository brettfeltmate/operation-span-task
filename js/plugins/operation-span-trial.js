/**
 * operation-span-trial plugin
 * Brett Feltmate
 *
 * Responsible for presenting all trial events, collecting responses, and writing trial data.
 *
 * if practice is set to either 'equations' or 'span', only an equation, or memory item, respectively, are presented.
 * */


/*
* TODO: since border around stimulus is always required, should be ever present. But, needs to be removed when block is completed (to not be present during instructions and such)
* */


jsPsych.plugins['operation-span-trial'] = (function() {
	/*
	* I spent a lot of time mulling over whether this was confusing, still don't know the answer, but:
	*
	* trial_info: object which stores relevant data (to the researcher), and eventually is what gets written as the data output.
	* plugin properties/methods access values from trial_info to inform the creation of DOM elements (which the researcher is NOT interested in, despite what jsPsych thinks)
	*
	* This can be confusing because sometimes you'll see plugin properties/methods accessing  trial.some_parameter_arg ,  these usually are cases
	* where parameter values passed as trial args need to be modified before assigning to trial_info, and in other cases are needed by the plugin, but are not necessary to store in trial_info.
	* */
	var trial_info = {};
	var plugin = {};

	plugin.info = {
		name: 'operation-span-trial',
		parameters: {
			practice: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: "practice",
				default: null,
				description: "Indicates whether this is a practice trial (yes/no)"
			},
			practice_type: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: "practice_type",
				default: null,
				description: "Indicates what type (span, equations) of practice trial is to be presented."
			},
			is_recall_trial: {
				type: jsPsych.plugins.parameterType.BOOL,
				pretty_name: 'is recall trial',
				default: null,
				description: "If true, this trial will end with a recall event"
			},
			equation: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: 'equation',
				default: null,
				description: "Mathematical equation (string) to be evaluated by user"
			},
			probe_validity: {
				type: jsPsych.plugins.parameterType.STRING,
				pretty_name: 'probe validity',
				default: null,
				description: "Should probe (proposed solution) be congruent (correct) or incongruent (incorrect)"
			},
			memory_item: {
				type: jsPsych.plugins.parameterType.IMAGE,
				pretty_name: 'Memory item',
				default: null,
				description: 'The memory item presented for later recall.'
			},
			memory_item_duration: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: "Memory item duration",
				default: 800,
				description: "How long to present memory item before trial terminates, in ms."
			},
			memory_items_presented: {
				type: jsPsych.plugins.parameterType.OBJECT,
				pretty_name: 'memory items, presented',
				default: {},
				description: "An obj containing the set of image names & paths presented this block"
			},
			memory_items_full: {
				type: jsPsych.plugins.parameterType.OBJECT,
				pretty_name: 'memory items, full set',
				default: {},
				description: 'An obj containing the full set of candidate image names & paths.'
			},
			set_num: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'set number',
				default: null,
				description: "Numerical index of the current set, respective to the number of sets to be presented for the current block."
			},
			set_size: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: "set size",
				default: null,
				description: "Number of items (i.e., trials) in the current set"
			},
			set_index: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'set index',
				default: null,
				description: 'Numerical index of the current item in the current set size.'
			}
		}
	};

	// Establishes event sequence for trial, sets stimulus properties, and spawns respective DOM elements
	plugin.set_trial_properties = function (trial) {

		// determine what events are to occur this trial
		plugin.present = {
			'equation': (trial_info.practice_type !== 'span'),
			'memory_item':  (trial_info.practice_type !== 'equation'),
			'recall': trial.is_recall_trial,
			'feedback': trial_info.set_index === trial_info.set_size
		}

		// for events to occur, get stimulus values later used to construct their respective DOM elements
		if (plugin.present.equation) {
			trial_info.equation_duration = experiment_params.equation_duration;
			trial_info.equation = (trial_info.practice === 'yes') ? trial_info.equation : plugin.extend_equation(trial_info.equation);
			trial_info.probe = plugin.get_probe_value(trial_info.probe_validity)
		}

		if (plugin.present.recall) {
			plugin.memory_items_full = trial.memory_items_full
			plugin.memory_items_presented = trial.memory_items_presented
		}

		plugin.labels = {
			'prompts': {
				'equation': "Press continue when you know the answer.",
				'probe':  "Is this the correct answer? Press confirm when done.",
				'memory_item': "",
				'recall': `<p>Select the images in the order they were presented in.<br><br><br>Press skip for forgotten items, clear to being again, and submit once done.</p>`
			},
			'buttons': {
				'equation': ['continue'],
				'probe': ['yes', 'no'],
				'recall': ['skip', 'clear', 'submit']
			}
		}

		// object which generates & stores DOM elements for this trial
		plugin.elements = {
			'stimuli': {
				'equation': (plugin.present.equation) ? plugin.spawn_equation_element(trial_info.equation) : null,
				'probe': (plugin.present.equation) ? plugin.spawn_probe_element(trial_info.probe) : null,
				'memory_item': (plugin.present.memory_item) ? plugin.spawn_memory_item_element(trial_info.memory_item) : null,
				'recall': (plugin.present.recall) ? plugin.spawn_recall_elements(plugin.memory_items_full) : null,
			},
			'buttons': {
				'equation': (plugin.present.equation) ? plugin.spawn_button_bank('equation') : null,
				'probe': (plugin.present.equation) ? plugin.spawn_button_bank('probe') : null,
				'recall': (plugin.present.recall) ? plugin.spawn_button_bank('recall') : null
			},
			'prompts': {
				'equation': (plugin.present.equation) ? plugin.spawn_prompt_element('equation') : null,
				'probe': (plugin.present.equation) ? plugin.spawn_prompt_element('probe') : null,
				'memory_item': (plugin.present.memory_item) ? plugin.spawn_prompt_element('memory_item') : null,
				'recall': (plugin.present.recall) ? plugin.spawn_prompt_element('recall') : null
			}
		}

		/*
			template containing all possible trial events and their properties (i.e., duration, DOM elements, subsequent events)

			duration: period after which event should self-teminate
			display: points to the appropriate collection of DOM elements which make up the event
			terminator: ID of button, if one exists for a given event, which terminates the event upon pressing
			timeout: if event is to timeout, the timeout handler is assigned to here to allow for cancelation (on button press)
			start: current time at trial start is assigned to here, used to compute rt
			rt: on event end, if rt is to be recorded, assigned the value of the current time, minus start time
			calls: if another event is to follow, this is given the name of the subsequent event.
		*/
		plugin.all_events = {
			'equation': {
				'duration': trial_info.equation_duration,
				'display': 'equation',
				'terminator': '#equation_continue',
				'timeout': null,
				'start': null,
				'rt': null,
				'calls': 'probe'
			},
			'probe': {
				'duration': null,
				'display': 'probe',
				'terminator': '[id*="probe"]',
				'timeout': null,
				'start': null,
				'rt': null,
				'response': null,
				'calls': (plugin.present.memory_item) ? 'memory_item' : null
			},
			'memory_item': {
				'duration': trial_info.memory_item_duration,
				'display': 'memory_item',
				'terminator': null,
				'timeout': null,
				'start': null,
				'rt': null,
				'calls': (plugin.present.recall) ? 'recall' : null
			},
			'recall': {
				'duration': null,
				'display': 'recall',
				'terminator': '#recall_submit',
				'timeout': null,
				'start': null,
				'rt': null,
				'recall_count': 1,
				'recall_selections': [],
				'calls': null
			}
		}

		// trial_events stores events which will occur this trial
		plugin.trial_events = {}
		if (plugin.present.equation) {
			plugin.trial_events.equation = plugin.all_events.equation
			plugin.trial_events.probe = plugin.all_events.probe
		};
		if (plugin.present.memory_item) {
			plugin.trial_events.memory_item = plugin.all_events.memory_item;
		}
		if (plugin.present.recall) {
			plugin.trial_events.recall = plugin.all_events.recall;
		}

		// Set whether probe events should be followed by a memory item, or if trial should end (null)
		plugin.call_defferal = (plugin.present.memory_item) ? 'memory_item' : null;
	}

	// Click event handler for recall trials
	plugin.click_handler = function (e) {
		e.stopPropagation();
		// If image not already selected
		if (!$(this).hasClass('selected')) {
			// label as being selected
			$(this).addClass('selected')
			// Label image with number indicating selection number
			$(this).children('.text-item').text(`${plugin.trial_events['recall'].recall_count}`);
			$(this).children('.image-item').addClass('selected')

			// grab image selected, append to recall bank
			pr($(this).children('.image-item').data('key'))
			let img_key = $(this).children('.image-item').data('key')
			let img_choice = $('<div />').addClass(`image-item bg-${img_key}`)

			$('.operation-span-recall-bank').append(img_choice)
			// Log total selections made, and log which image was chosen
			plugin.trial_events['recall'].recall_count += 1;
			plugin.trial_events['recall'].recall_selections.push(img_key);

		}
	}

	// Button event handler for equation, probe, and recall events.
	plugin.button_handler = function (e) {
		e.stopPropagation();
		// Grab label of button pressed
		let pressed = $(this).attr('id');

		switch(pressed) {
			// Log probe response
			case 'probe_yes':
			case 'probe_no':
				plugin.trial_events['probe'].response = pressed.replace('probe_', "");
				break;
			// If skip, increment recall count, log choice to skip, and insert blank image to recall bank
			case 'recall_skip':
				$('.operation-span-recall-bank').append($('<div >').addClass('image-item skip'))
				plugin.trial_events['recall'].recall_count += 1;
				plugin.trial_events['recall'].recall_selections.push('skip');
				break;
			// If clear, empty recall bank, set all images to unselected,  and reset selection count & choices
			case 'recall_clear':
				$('#trial_display').find('.selected').removeClass('selected')
				$('.recall-index').empty();
				$('.operation-span-recall-bank').empty();
				plugin.trial_events['recall'].recall_count = 1;
				plugin.trial_events['recall'].recall_selections = [];
				break;
		}
	}

	// Procedurally generate additional operation to add to equation, only called during testing trials
	plugin.extend_equation = function(equation) {
		// Randomly select initial value of appended operand
		let operand = ranged_random(-9, 9);
		// Evaluate equation with additional operand
		let result;
		if (operand < 0) {
			result = evaluateAsFloat(`${equation} - ${Math.abs(operand)}`);
		} else {
			result = evaluateAsFloat(`${equation} + ${Math.abs(operand)}`);
		}
		// Until result is greater than 0 and operand itself is non-zero, increment operand by 3 and reevaluate.
		while (result <= 0 || operand === 0 ) {
			operand += 3;
			if (operand < 0) {
				result = evaluateAsFloat(`${equation} - ${Math.abs(operand)}`);
			} else {
				result = evaluateAsFloat(`${equation} + ${Math.abs(operand)}`);
			}
		};
		// Determine if operation is subtractive or additive, conditional on whether operand is negative/positive
		let operator = (operand < 0) ? '-' : '+';
		return `${equation} {0} {1}`.format(operator, Math.abs(operand))
	}

	// Procedurally generate proposed solution (probe), which may be correct or incorrect if validity is congruent or incongruent, respectively
	plugin.get_probe_value = function(validity) {
		// Evaluate true solution
		let solution_actual = evaluateAsFloat(trial_info.equation)
		// If congruent, return true solution
		if (validity === 'congruent') {
			return  solution_actual;
		} else {
			// otherwise adjust solution by random amount
			adjustment = ranged_random(-9, 9);
			// increment adjustment by 2 until proposed solution is positive and not equal to actual solution
			let proposed_solution = solution_actual + adjustment;
			while (proposed_solution <= 0 || proposed_solution === solution_actual) {
				adjustment += 2
				proposed_solution = solution_actual + adjustment
			}
			return proposed_solution
		}
	}

	// Given equation string, generates DOM element to represent it.
	plugin.spawn_equation_element = function(equation) {
		return $('<div />').addClass('operation-span-single-item text-item').append(
			$('<p />').text(equation.replace('*', 'x').replace('/', '÷') + ' = ?')
		).attr('id', 'equation_element')
	}

	// Given probe string, generates DOM element to represent it.
	plugin.spawn_probe_element = function(probe) {
		return $('<div />').addClass('operation-span-single-item text-item').append(
			$('<p >').text(probe)
		).attr('id', 'probe_element')
	}

	// Given event type, generates appropriate DOM element
	plugin.spawn_prompt_element = function(event_type) {
		return $('<div />').addClass('text-item prompt').html(plugin.labels.prompts[event_type])
	}

	// Given event type, generates respective button elements & bank to contain them
	plugin.spawn_button_bank = function(event_type) {
		let buttons = [];
		plugin.labels.buttons[event_type].forEach(function(label) {
			button_id = event_type + '_' + label.replace(' ', '_')
			buttons.push($('<div />').addClass('operation-span-button').attr('id',  button_id).html(label))
		})
		return $('<div />').addClass('operation-span-button-bank').append(buttons)
	}

	// Given an image name, generates element to hold that image. Used on 'span' trial events
	plugin.spawn_memory_item_element = function(span_item) {
		return $('<div />').addClass(
			'operation-span-single-item')
			.append( $('<div />').addClass(`image-item bg-${span_item}`)
		).attr('id', 'memory_item_element')
	}

	// Given an array of image names, generates element for each individual image contained in recall array
	plugin.spawn_recall_elements = function(span_items) {
		let array_elements = [];
		// for each image, generate element to contain image..
		for (let i=0; i<span_items.length; i++) {
			let cell = $('<div />').addClass('operation-span-recall-item');
			let cell_contents = [];

			cell_contents.push(
				$('<div />').addClass('text-item recall-index'), // As images are selected, inserted here is the index number representing recall order
				$('<div />').addClass(`image-item recall-image bg-${span_items[i]}`).data('key', span_items[i]) // 'key' data tag used to log images selected.
			)
			$(cell).append(cell_contents)
			array_elements.push(cell)
		}
		// generate array element to collectively house individual image elements
		let recall_array = $('<div />').addClass('operation-span-recall-array').append(
			array_shuffle(array_elements)
		).attr('id', 'recall_array_element')
		// generate element, initially empty, which gets populated with images as they are selected.
		let recall_bank = $('<div />').addClass('operation-span-recall-bank').attr('id', 'recall_bank')

		return [recall_bank, recall_array]
	}

	// Given a label denoting a trial event, populates display with respective elements & attaches event handlers
	plugin.present_display = function(event_type) {
		let event_elements = []
		// grab elements for event
		event_elements.push(plugin.elements.prompts[event_type])
		event_elements.push(plugin.elements.buttons[event_type])

		// for recall events, stimulus points to an array of elements
		// in that case, each item needs to be pushed to event_elements individually
		if (!is_array(plugin.elements.stimuli[event_type])) {
			event_elements.push(plugin.elements.stimuli[event_type])
		} else {
			plugin.elements.stimuli[event_type].forEach(function (ele) {
				event_elements.push(ele)
			})
		}
		// attach event handlers to body
		$('body')
			.on('click', '.operation-span-button', plugin.button_handler)
			.on('click', '.operation-span-recall-item', plugin.click_handler)

		// append elements to trial display
		$('#trial_display').empty().append(event_elements)
	}

	// Aggregates, computes, and logs performance metrics., then ends trial
	// on span only trials, no performance is logged, but waits 200 ms before ending trial
	plugin.log_performance = function() {
		// log performance on equation & probe
		if (plugin.present.equation) {
			// if rt for event is not null, grab, otherwise set as timeout
			trial_info.equation_rt = (plugin.trial_events['equation'].rt) ? plugin.trial_events['equation'].rt : 'timeout';
			trial_info.probe_rt =  (plugin.trial_events['probe'].rt) ? plugin.trial_events['probe'].rt : 'timeout';
			trial_info.probe_response = (plugin.trial_events['probe'].response) ? plugin.trial_events['probe'].response : 'timeout';
			// label whether probe response was erroneous
			switch(trial_info.probe_validity) {
				case "congruent":
					trial_info.probe_error = (trial_info.probe_response === 'yes') ? 0 : 1;
					break;
				case 'incongruent':
					trial_info.probe_error = (trial_info.probe_response === 'no') ? 0 : 1;
					break;
			}
			trial_info.probe_error_set_percent = getPercentError(extract('probe_error', data_repo), trial_info.set_size)
		}
		// log performance on recall task
		if (plugin.present.recall) {
			trial_info.recall_rt = plugin.trial_events['recall'].rt;
			trial_info.recall_order = plugin.trial_events['recall'].recall_selections;
			// simply a count of correct recalls
			trial_info.recall_partial_score = countMatches(plugin.memory_items_presented, trial_info.recall_order);
			// equal to set size if, and only if, 100% recall accuracy, otherwise 0
			trial_info.recall_absolute_score = (trial_info.recall_partial_score === plugin.memory_items_presented.length) ? plugin.memory_items_presented.length : 0;
		}

		// if end of block where events required responses, provide feedback on performance
		if (plugin.present.feedback) {
			plugin.give_feedback()
		} else {
			// otherwise, if span practice, wait 200ms before ending trial
			if (trial_info.practice_type === 'span') {
				setTimeout(function() {
					plugin.end_trial()
				}, 200)
			// in all other cases, end trial immediately.
			} else {
				plugin.end_trial()
			}
		}

	}

	// Presents feedback on equation and/or recall performance, only called when set size has been exhausted
	plugin.give_feedback = function() {
		// generate feedback dependent on type of events which occurred
		let feedback = $('<div />').addClass('operation-span-single-item')
		// equation feedback
		if (plugin.present.equation) {
			let correct_count = 0;
			/*
			* TODO: for this to work, you need to select ONLY probe_errors which correspond to the present set
			* */

			pr(extract('probe_error', data_repo), 'probe_error')
			pr(sum(extract('probe_error', data_repo)), 'probe error summed')
			//let correct_count = trial_info.set_size - sum(extract('probe_error', data_repo))
			$(feedback).append(
				$('<p />').text(`You correctly answered {0} of {1} equations`.format(correct_count, trial_info.set_size))
			)
		}
		// recall feedback
		if (plugin.present.recall) {
			$(feedback).append(
				$('<p />').text(`You correctly recalled {0} of {1} items`.format(trial_info.recall_partial_score, plugin.memory_items_presented.length))
			)
		}
		// display feedback for 2000 ms before ending trial
		$('#trial_display').empty().append(feedback)
		setTimeout(function() {
			plugin.end_trial()
		}, 2000)
	}

	// shorthand function for detaching event handlers and clearing display
	plugin.reset_display = function() {
		$('body').off()
		$('#trial_display').empty()
	}

	// Runs event sequence denoted by event_type (string, either 'equation', 'probe', 'memory_item', or 'recall'
	plugin.run_sequence = function(event_type) {
		// Load event display
		plugin.present_display(plugin.trial_events[event_type].display)
		// start timing for RT
		plugin.trial_events[event_type].start = now();

		// If event has a timeout
		if (plugin.trial_events[event_type].duration !== null) {
			// set timeout to fire if duration elapses without response
			plugin.trial_events[event_type].timeout = setTimeout(function() {
				// detach event handlers and clear display
				plugin.reset_display();

				// if equation event times-out, then probe event cannot be allowed to occur
				if (event_type === 'equation') { plugin.trial_events[event_type].calls = plugin.call_defferal; }

				// if there is another event to occur, run it, otherwise log trial performance
				if (plugin.trial_events[event_type].calls !== null) {
					plugin.run_sequence(plugin.trial_events[event_type].calls)
				} else {
					plugin.log_performance()
				}

			// duration to timeout after
			}, plugin.trial_events[event_type].duration)
		}

		// For events which may be terminated by button press,
		if (plugin.trial_events[event_type].terminator !== null) {
			// Attach handler to listen for button press
			$('body').on('click', plugin.trial_events[event_type].terminator , {event_type: event_type},function(event) {
				// detach handler and clear display if pressed
				plugin.reset_display();
				// clear timeout initialized at event start
				clearTimeout(plugin.trial_events[event.data.event_type].timeout);
				// grab rt to respond to event
				plugin.trial_events[event.data.event_type].rt = now() - plugin.trial_events[event.data.event_type].start;
				// if 'equation' event, set 'probe' duration to equation_duration - equation rt
				if (event.data.event_type === 'equation') {
					plugin.trial_events['probe'].duration = plugin.trial_events['equation'].duration - plugin.trial_events['equation'].rt
				}

				// if there is another event to occur, run it, otherwise log trial performance
				if (plugin.trial_events[event.data.event_type].calls) {
					plugin.run_sequence(plugin.trial_events[event.data.event_type].calls)
				} else { plugin.log_performance() }
			})
		}

	}

	// Ends trial
	plugin.end_trial = function() {
		// remove any remaining event listeners
		$('body').off()
		// push trial data to repo
		data_repo.push(trial_info)
		// finish trial, jsPsych requires we pass it something.
		jsPsych.finishTrial(trial_info)
	}

	// Executes trial
	plugin.trial = function(display_element, trial) {
		// remove obnoxious self-important loading bar
		$('#jspsych-loading-progress-bar-container').remove()
		// make sure no html persisted from last trial
		display_element.innerHTML = '';
		// create copy of data_template, assign matching values passed from trial (parameters defined in plugin.info)
		trial_info = obj_left_join(data_template, trial)
		// all events utilize the same basic display, which is generatively populated with elements
		plugin.trial_display = $('<div />').addClass('operation-span-layout').attr('id', 'trial_display')
		// add trial display to display element
		$(display_element).append(plugin.trial_display)
		// initialize and set trial properties
		plugin.set_trial_properties(trial)
		// Starting from the first event to occur, run sequence of events.
		plugin.run_sequence(Object.keys(plugin.trial_events)[0])
	};

	return plugin;
})();

