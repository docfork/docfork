# Docfork dgrep demo — recorded with VHS (charmbracelet/vhs)
# Install: brew install vhs
# Run: vhs demo.tape

Output demo.gif
Set Shell zsh
Set FontFamily "JetBrains Mono"
Set FontSize 16
Set Width 832
Set Height 548
Set Padding 24
Set Framerate 50
Set CursorBlink false
Set WindowBar Colorful
Set WindowBarSize 40
Set BorderRadius 8
Set Margin 20
Set MarginFill "#171B22"
Set TypingSpeed 40ms
Set Theme { "name": "docfork", "black": "#0F0F11", "red": "#d4451a", "green": "#34d399", "yellow": "#fbbf24", "blue": "#0A91B2", "magenta": "#c084fc", "cyan": "#0A91B2", "white": "#e8e4e0", "brightBlack": "#78716c", "brightWhite": "#fafaf9", "background": "#0F0F11", "foreground": "#e8e4e0", "selectionBackground": "#78716c", "cursorColor": "#e8e4e0" }

# Init — auto-confirm all prompts
Type "dgrep --yes"
Enter
Sleep 4s

# Search — limit to 3 results so it fits on screen
Type "dgrep search 'middleware redirect' -l vercel/next.js --limit 3 --yes"
Enter
Sleep 3s

# Freeze on results
Sleep 3s
