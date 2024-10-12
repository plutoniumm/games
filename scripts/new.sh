echo "Enter name of game:"
read name

# touch "g/$name.html"
cp "./scripts/template.html" "g/$name.html"
cd "g"
sed -i '' "s/{{name}}/$name/g" "$name.html"
cd ..

touch "js/$name.js"
touch "css/$name.css"

echo "\nCreated files for $name"
echo "Remember to add $name to index.html and add icons"