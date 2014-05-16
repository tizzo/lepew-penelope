Lepew Penelope
==============
[![Build Status](https://travis-ci.org/tizzo/lepew-penelope.svg?branch=master)](https://travis-ci.org/tizzo/lepew-penelope)
[![Coverage Status](https://coveralls.io/repos/tizzo/lepew-penelope/badge.png?branch=master)](https://coveralls.io/r/tizzo/lepew-penelope?branch=master)

This module wraps child processes and unifies their stdout and stderr streams into a signle unified json event stream.  It can currnently be used as a library with other node code but will soon feature a command line utiltiy.

This project was created to facilitate running multiple processes inside a docker container easily and being able to easily separate the streams of all of the running processes.
