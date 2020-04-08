<script>
export default {
  middleware({ redirect } ) {
    return redirect({ name: 'clusters' });
  }
};
</script>
