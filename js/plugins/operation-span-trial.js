/**
 * operation-span-trial plugin
 * Brett Feltmate
 *
 * Responsible for presenting all trial events, collecting responses, and writing trial data.
 *
 * if practice is set to either 'equations' or 'span', only an equation, or memory item, respectively, are presented.
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

	// we want to pre-load media; the arguments here are plug-in name, plug-in parameter, media-type
	// jsPsych.pluginAPI.registerPreload('operation-span-trial', 'memory_item', 'image');
	// jsPsych.pluginAPI.registerPreload('operation-span-trial', 'memory_items_full', 'image');

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
				default: 5000,
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

	plugin.set_trial_properties = function (trial) {





		plugin.present_equation = false
		plugin.present_memory_item = false
		plugin.present_equation = (trial_info.practice_type !== 'span');
		plugin.present_memory_item = (trial_info.practice_type !== 'equation');
		plugin.present_recall = trial.is_recall_trial;

		pr(plugin.present_equation, 'present equation')
		pr(plugin.present_memory_item, 'present memory item')
		pr(plugin.present_recall, 'present recall')

		if (plugin.present_equation) {
			trial_info.equation_duration = experiment_params.equation_duration;
			trial_info.equation = (trial_info.practice === 'yes') ? trial_info.equation : plugin.extend_equation(trial_info.equation);
			trial_info.probe = plugin.get_probe_value(trial_info.probe_validity)
		}

		if (plugin.present_recall) {
			plugin.memory_items_full = trial.memory_items_full
			plugin.memory_items_presented = trial.memory_items_presented

		}

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
				'terminator': '#probe_submit',
				'timeout': null,
				'start': null,
				'rt': null,
				'response': null,
				'calls': (plugin.present_memory_item) ? 'memory_item' : null
			},
			'memory_item': {
				'duration': trial_info.memory_item_duration,
				'display': 'memory_item',
				'terminator': null,
				'timeout': null,
				'start': null,
				'rt': null,
				'calls': (plugin.present_recall) ? 'recall' : null
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

		plugin.trial_events = {}

		if (plugin.present_equation) {
			plugin.trial_events.equation = plugin.all_events.equation
			plugin.trial_events.probe = plugin.all_events.probe
		};
		if (plugin.present_memory_item) {
			plugin.trial_events.memory_item = plugin.all_events.memory_item;
		}
		if (plugin.present_recall) {
			plugin.trial_events.recall = plugin.all_events.recall;
		}

		plugin.call_defferal = (plugin.present_memory_item) ? 'memory_item' : null

		plugin.stimuli = {
			'equation': (plugin.present_equation) ? plugin.spawn_equation_element(trial_info.equation) : null,
			'probe': (plugin.present_equation) ? plugin.spawn_probe_element(trial_info.probe) : null,
			'memory_item': (plugin.present_memory_item) ? plugin.spawn_memory_item_element(trial_info.memory_item) : null,
			'recall': (plugin.present_recall) ? plugin.spawn_recall_elements(plugin.memory_items_full) : null,
		}

		plugin.buttons = {
			'equation': (plugin.present_equation) ? plugin.spawn_button_bank('equation') : null,
			'probe': (plugin.present_equation) ? plugin.spawn_button_bank('probe') : null,
			'recall': (plugin.present_recall) ? plugin.spawn_button_bank('recall') : null
		}

		plugin.prompts = {
			'equation': (plugin.present_equation) ? plugin.spawn_prompt_element('equation') : null,
			'probe': (plugin.present_equation) ? plugin.spawn_prompt_element('probe') : null,
			'memory_item': (plugin.present_memory_item) ? plugin.spawn_prompt_element('memory_item') : null,
			'recall': (plugin.present_recall) ? plugin.spawn_prompt_element('recall') : null
		}
	}

	plugin.click_handler = function (e) {
		e.stopPropagation();

		if (!$(this).hasClass('selected')) {
			// label as being selected
			$(this).addClass('selected')
			// Add selection number
			$(this).children('.text-item').text(`${plugin.trial_events['recall'].recall_count}`);
			$(this).children('.image-item').addClass('selected')

			// grab image selected, append to recall bank
			pr($(this).children('.image-item').data('key'))
			let img_key = $(this).children('.image-item').data('key')
			let img_choice = $('<div />').addClass(`image-item bg-${img_key}`)

			$('.operation-span-recall-bank').append(img_choice)

			plugin.trial_events['recall'].recall_count += 1;
			plugin.trial_events['recall'].recall_selections.push(img_key);

		}
	}

	plugin.button_handler = function (e) {
		e.stopPropagation();
		let pressed = $(this).attr('id');

		switch(pressed) {
			case 'probe_yes':
			case 'probe_no':
				plugin.trial_events['probe'].response = pressed.replace('probe_', "");
				$('.operation-span-button').removeClass('selected')
				$('#'+pressed).addClass('selected')
				break;
			case 'recall_skip':
				pr('skip fired')
				$('.operation-span-recall-bank').append($('<div >').addClass('image-item skip'))
				plugin.trial_events['recall'].recall_count += 1;
				plugin.trial_events['recall'].recall_selections.push('skip');
				break;
			case 'recall_clear':
				pr('clear fired')
				$('#trial_display').find('.selected').removeClass('selected')
				$('.recall-index').empty();
				$('.operation-span-recall-bank').empty();
				plugin.trial_events['recall'].recall_count = 1;
				plugin.trial_events['recall'].recall_selections = [];
				break;
		}
	}

	plugin.extend_equation = function(equation) {
		pr(equation)
		let operand = ranged_random(-9, 9);
		pr(operand)

		let result;
		if (operand < 0) {
			result = evaluateAsFloat(`${equation} - ${Math.abs(operand)}`);
		} else {
			result = evaluateAsFloat(`${equation} + ${Math.abs(operand)}`);
		}
		while (result <= 0 || operand === 0 ) {
			operand += 3;
			if (operand < 0) {
				result = evaluateAsFloat(`${equation} - ${Math.abs(operand)}`);
			} else {
				result = evaluateAsFloat(`${equation} + ${Math.abs(operand)}`);
			}
		};

		let operator = (operand < 0) ? '-' : '+';
		return `${equation} {0} {1}`.format(operator, Math.abs(operand))
	}

	plugin.get_probe_value = function(validity) {
		pr('get_probe_value({0})'.format(validity))
		let solution_actual = evaluateAsFloat(trial_info.equation)
		if (validity === 'congruent') {
			return  solution_actual;
		} else {
			adjustment = ranged_random(-9, 9);
			let proposed_solution = solution_actual + adjustment;
			while (proposed_solution <= 0 || proposed_solution === solution_actual) {
				adjustment += 2
				proposed_solution = solution_actual + adjustment
			}
			return proposed_solution
		}
	}

	plugin.spawn_equation_element = function(equation) {
		let equation_text = equation.replace('*', 'x').replace('/', '÷') + ' = ?';

		return $('<div />').addClass('operation-span-single-item text-item').append(
			$('<p />').text(equation_text)
		).attr('id', 'equation_element')
	}

	plugin.spawn_probe_element = function(probe) {
		let probe_item = $('<p >').text(probe);
		return $('<div />').addClass('operation-span-single-item text-item').append(
			probe_item
		).attr('id', 'probe_element')
	}

	plugin.spawn_prompt_element = function(event_type) {

		prompts = {
			'equation': "Press continue when you know the answer.",
			'probe':  "Is this the correct answer? Press confirm when done.",
			'memory_item': "test",
			'recall': `<p>Select the images in the order they were presented in.<br><br><br>Press skip for forgetten items, clear to being again, and submit once done.</p>`
		}

		return $('<div />').addClass('text-item prompt').html(prompts[event_type])
	}

	plugin.spawn_button_bank = function(event_type) {
		button_labels = {
			'equation': ['continue'],
			'probe': ['yes', 'no', 'submit'],
			'recall': ['skip', 'clear', 'submit']
		}
		labels = button_labels[event_type];

		let buttons = [];
		labels.forEach(function(label) {
			button_id = event_type + '_' + label.replace(' ', '_')
			buttons.push($('<div />').addClass('operation-span-button').attr('id',  button_id).html(label))
		})

		return $('<div />').addClass('operation-span-button-bank').append(buttons)

	}

	plugin.spawn_memory_item_element = function(span_item) {
		let memory_stim = $('<div />').addClass(`image-item bg-${span_item}`)

		return $('<div />').addClass('operation-span-single-item').append(
			memory_stim
		).attr('id', 'memory_item_element')
	}

	plugin.spawn_recall_elements = function(span_items) {
		let array_elements = [];

		for (let i=0; i<span_items.length; i++) {


			let cell = $('<div />').addClass('operation-span-recall-item');
			let cell_contents = [];

			cell_contents.push(
				$('<div />').addClass('text-item recall-index'),
				$('<div />').addClass(`image-item recall-image bg-${span_items[i]}`).data('key', span_items[i])
			)

			//pr($('<div />').addClass(`image-item recall-image bg-${span_items[i]}`).data('key'))

			$(cell).append(cell_contents)
			array_elements.push(cell)
		}

		let recall_array = $('<div />').addClass('operation-span-recall-array').append(
			array_shuffle(array_elements)
		).attr('id', 'recall_array_element')

		let recall_bank = $('<div />').addClass('operation-span-recall-bank').attr('id', 'recall_bank')

		return [recall_bank, recall_array]
	}

	plugin.present_display = function(event_type) {

		let prompt = plugin.prompts[event_type]
		let buttons = plugin.buttons[event_type]
		let stimulus = plugin.stimuli[event_type]

		let to_append = [prompt, buttons]
		if (is_array(stimulus)) {
			stimulus.forEach(function(item) {
				to_append.push(item)
			})
		} else {to_append.push(stimulus)}

		$('body').on('click', '.operation-span-button', plugin.button_handler)
		$('body').on('click', '.operation-span-recall-item', plugin.click_handler)

		$('#trial_display').empty().append(to_append)


	}

	plugin.log_performance = function() {

		if (plugin.present_equation) {

			trial_info.equation_rt = (plugin.trial_events['equation'].rt) ? plugin.trial_events['equation'].rt : 'timeout';
			trial_info.probe_rt =  (plugin.trial_events['probe'].rt) ? plugin.trial_events['probe'].rt : 'timeout';
			trial_info.probe_response = (plugin.trial_events['probe'].response) ? plugin.trial_events['probe'].response : 'timeout';

			switch(trial_info.probe_validity) {
				case "congruent":
					trial_info.probe_error = (trial_info.probe_response === 'no');
					break;
				case 'incongruent':
					trial_info.probe_error = (trial_info.probe_response === 'yes');
					break;
			}
		}

		if (plugin.present_recall) {
			trial_info.recall_rt = plugin.trial_events['recall'].rt;
			trial_info.recall_order = plugin.trial_events['recall'].recall_selections;

			trial_info.recall_partial_score = count_matches(plugin.memory_items_presented, trial_info.recall_order);
			trial_info.recall_absolute_score = (trial_info.recall_partial_score === plugin.memory_items_presented.length) ? plugin.memory_items_presented.length : 0;

			let feedback = $('<div />').addClass('operation-span-single-item').append(
				$('<p />').text(`You correctly recalled {0} of {1} items`.format(trial_info.recall_partial_score, plugin.memory_items_presented.length))
			)
			$('#trial_display').empty().append(feedback)

		}
		if (plugin.present_recall) {
			setTimeout(function() {
				plugin.end_trial()
			}, 2000)
		} else {
			plugin.end_trial()
		}
	}

	plugin.run_sequence = function(event_type) {

		// present first event
		plugin.present_display(plugin.trial_events[event_type].display)


		// start timing for RT
		plugin.trial_events[event_type].start = now();

		// If event has a timeout
		if (plugin.trial_events[event_type].duration !== null) {
			// set timeout to fire if duration elapses without response
			plugin.trial_events[event_type].timeout = setTimeout(function() {
				$('body').off()
				$('#trial_display').empty()
				// detach handlers to prevent responding post timeout
				//$('body').off();

				// if equation event times-out, then probe event cannot be allowed to occur
				if (event_type === 'equation') {
					plugin.trial_events[event_type].calls = plugin.call_defferal;
				}

				// if there is another event to occur, run it, otherwise end trial
				if (plugin.trial_events[event_type].calls !== null) {
					plugin.run_sequence(plugin.trial_events[event_type].calls)
				} else {
					plugin.log_performance()
				}

				//plugin.trial_events[event_type].calls ? plugin.run_sequence(plugin.trial_events[event_type].calls) : plugin.log_performance()
			}, plugin.trial_events[event_type].duration)
		}

		// if event comes with a button that terminates it
		if (plugin.trial_events[event_type].terminator !== null) {
			// upon clicking that button
			$('body').on('click', plugin.trial_events[event_type].terminator , {event_type: event_type},function(event) {
				$('body').off()
				$('#trial_display').empty()
				// clear timeout initialized at event start
				clearTimeout(plugin.trial_events[event.data.event_type].timeout);
				// grab rt to respond to event
				plugin.trial_events[event.data.event_type].rt = now() - plugin.trial_events[event.data.event_type].start;

				if (event.data.event_type === 'equation') {
					plugin.trial_events['probe'].duration = plugin.trial_events['equation'].duration - plugin.trial_events['equation'].rt
				}

				// if there is another event to occur, run it, otherwise end trial
				plugin.trial_events[event.data.event_type].calls ? plugin.run_sequence(plugin.trial_events[event.data.event_type].calls) : plugin.log_performance()
			})
		}


	}

	plugin.end_trial = function() {
		$('body').off()
		data_repo.push(trial_info)
		pr(trial_info)
		jsPsych.finishTrial(trial_info)
	}

	plugin.trial = function(display_element, trial) {
		$('#jspsych-loading-progress-bar-container').remove()
		display_element.innerHTML = '';
		trial_info = obj_left_join(data_template, trial)


		pr('trial()')

		plugin.trial_display = $('<div />').addClass('operation-span-layout').attr('id', 'trial_display')
		$(display_element).append(plugin.trial_display)

		plugin.set_trial_properties(trial)
		//
		// setTimeout(function() {
		// 	die();
		// },1000)




		pr(Object.keys(plugin.trial_events))
		plugin.run_sequence(Object.keys(plugin.trial_events)[0])
	};

	return plugin;
})();

